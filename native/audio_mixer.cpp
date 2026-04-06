#include <algorithm>
#include <cerrno>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <fcntl.h>
#include <signal.h>
#include <sys/wait.h>
#include <unistd.h>
#include <utility>
#include <vector>

namespace {

constexpr int kSampleRate = 48000;
constexpr int kChannels = 2;
constexpr std::size_t kFramesPerChunk = 4800;  // 100ms — 5x fewer syscalls
constexpr std::size_t kSamplesPerChunk = kFramesPerChunk * kChannels;
constexpr int kFixedPointShift = 8;

struct AmbientInput {
  std::string path;
  double volume;
};

struct TrackInput {
  std::string path;
  double volume;
  bool loop;
  double offset_seconds;
};

// ---------------------------------------------------------------------------
// FfmpegPcmStream — uses fork/exec instead of popen for direct PID control
// ---------------------------------------------------------------------------
class FfmpegPcmStream {
 public:
  explicit FfmpegPcmStream(const TrackInput& input) : track_(input) {
    volume_fixed_ = static_cast<int32_t>(input.volume * (1 << kFixedPointShift));
    open();
  }

  ~FfmpegPcmStream() { close_pipe(); }

  // Read exactly `requested_samples` int16 samples into `out`.
  // `out` must already be sized to `requested_samples`.
  // Returns false only when no data at all could be produced (EOF on non-loop).
  bool read_chunk(int16_t* out, std::size_t requested_samples) {
    std::size_t offset = 0;

    while (offset < requested_samples) {
      if (fd_ < 0) return offset > 0;

      ssize_t bytes_read = ::read(
        fd_,
        reinterpret_cast<char*>(out + offset),
        (requested_samples - offset) * sizeof(int16_t)
      );

      if (bytes_read > 0) {
        offset += static_cast<std::size_t>(bytes_read) / sizeof(int16_t);
        continue;
      }

      // EOF or error
      if (!track_.loop) {
        if (offset == 0) return false;
        std::fill(out + offset, out + requested_samples, static_cast<int16_t>(0));
        return true;
      }

      reopen_loop_stream();
    }

    return true;
  }

  int32_t volume_fixed() const { return volume_fixed_; }

 private:
  void build_argv(std::vector<std::string>& args, const TrackInput& input) {
    args.clear();
    args.push_back("ffmpeg");
    args.push_back("-hide_banner");
    args.push_back("-loglevel");
    args.push_back("error");

    if (input.loop) {
      args.push_back("-stream_loop");
      args.push_back("-1");
    }

    if (input.offset_seconds > 0.0) {
      args.push_back("-ss");
      args.push_back(std::to_string(input.offset_seconds));
    }

    args.push_back("-i");
    args.push_back(input.path);
    args.push_back("-f");
    args.push_back("s16le");
    args.push_back("-acodec");
    args.push_back("pcm_s16le");
    args.push_back("-ac");
    args.push_back("2");
    args.push_back("-ar");
    args.push_back("48000");
    args.push_back("-");
  }

  void open() {
    std::vector<std::string> args;
    build_argv(args, track_);
    spawn(args);
  }

  void reopen_loop_stream() {
    close_pipe();
    TrackInput loop_input = track_;
    loop_input.offset_seconds = 0.0;
    std::vector<std::string> args;
    build_argv(args, loop_input);
    spawn(args);
  }

  void spawn(const std::vector<std::string>& args) {
    int pipefd[2];
    if (pipe(pipefd) != 0) {
      throw std::runtime_error("pipe() failed");
    }

    pid_t pid = fork();
    if (pid < 0) {
      ::close(pipefd[0]);
      ::close(pipefd[1]);
      throw std::runtime_error("fork() failed");
    }

    if (pid == 0) {
      // child
      ::close(pipefd[0]);
      dup2(pipefd[1], STDOUT_FILENO);
      ::close(pipefd[1]);

      // redirect stderr to /dev/null
      int devnull = ::open("/dev/null", O_WRONLY);
      if (devnull >= 0) { dup2(devnull, STDERR_FILENO); ::close(devnull); }

      std::vector<const char*> c_args;
      c_args.reserve(args.size() + 1);
      for (const auto& a : args) c_args.push_back(a.c_str());
      c_args.push_back(nullptr);

      execvp(c_args[0], const_cast<char* const*>(c_args.data()));
      _exit(127);
    }

    // parent
    ::close(pipefd[1]);
    fd_ = pipefd[0];
    child_pid_ = pid;
  }

  void close_pipe() {
    if (fd_ >= 0) {
      ::close(fd_);
      fd_ = -1;
    }
    if (child_pid_ > 0) {
      kill(child_pid_, SIGKILL);
      waitpid(child_pid_, nullptr, 0);
      child_pid_ = -1;
    }
  }

  TrackInput track_;
  int fd_ = -1;
  pid_t child_pid_ = -1;
  int32_t volume_fixed_ = 256;
};

// ---------------------------------------------------------------------------
// Probe mode — print duration in seconds using ffprobe
// ---------------------------------------------------------------------------
int probe_duration(const std::string& path) {
  int pipefd[2];
  if (pipe(pipefd) != 0) {
    std::cerr << "pipe() failed\n";
    return 1;
  }

  pid_t pid = fork();
  if (pid < 0) {
    std::cerr << "fork() failed\n";
    return 1;
  }

  if (pid == 0) {
    ::close(pipefd[0]);
    dup2(pipefd[1], STDOUT_FILENO);
    ::close(pipefd[1]);
    int devnull = ::open("/dev/null", O_WRONLY);
    if (devnull >= 0) { dup2(devnull, STDERR_FILENO); ::close(devnull); }

    execlp("ffprobe", "ffprobe",
           "-v", "quiet",
           "-show_entries", "format=duration",
           "-of", "csv=p=0",
           path.c_str(),
           nullptr);
    _exit(127);
  }

  ::close(pipefd[1]);

  char buf[256];
  std::string output;
  ssize_t n;
  while ((n = ::read(pipefd[0], buf, sizeof(buf) - 1)) > 0) {
    buf[n] = '\0';
    output += buf;
  }
  ::close(pipefd[0]);

  int status;
  waitpid(pid, &status, 0);

  if (!output.empty()) {
    std::cout << output;
    if (output.back() != '\n') std::cout << '\n';
  }

  return (WIFEXITED(status) && WEXITSTATUS(status) == 0) ? 0 : 1;
}

// ---------------------------------------------------------------------------
void print_usage() {
  std::cerr << "usage: audio_mixer [--song <path>] [--song-volume <value>] [--offset <seconds>]"
            << " [--ambient <path> --ambient-volume <value>]...\n"
            << "       audio_mixer --probe <path>\n";
}

}  // namespace

int main(int argc, char** argv) {
  std::string song_path;
  double song_volume = 1.0;
  double song_offset = 0.0;
  std::vector<AmbientInput> ambients;
  std::string probe_path;

  for (int i = 1; i < argc; ++i) {
    const std::string arg = argv[i];

    if (arg == "--probe" && i + 1 < argc) {
      probe_path = argv[++i];
      continue;
    }

    if (arg == "--song" && i + 1 < argc) {
      song_path = argv[++i];
      continue;
    }

    if (arg == "--song-volume" && i + 1 < argc) {
      song_volume = std::stod(argv[++i]);
      continue;
    }

    if (arg == "--offset" && i + 1 < argc) {
      song_offset = std::max(0.0, std::stod(argv[++i]));
      continue;
    }

    if (arg == "--ambient" && i + 1 < argc) {
      AmbientInput input;
      input.path = argv[++i];
      input.volume = 1.0;
      ambients.push_back(std::move(input));
      continue;
    }

    if (arg == "--ambient-volume" && i + 1 < argc) {
      if (ambients.empty()) {
        std::cerr << "ambient volume provided without an ambient input\n";
        return 1;
      }

      ambients.back().volume = std::stod(argv[++i]);
      continue;
    }

    print_usage();
    return 1;
  }

  // --probe mode
  if (!probe_path.empty()) {
    return probe_duration(probe_path);
  }

  // Need at least a song or an ambient
  if (song_path.empty() && ambients.empty()) {
    print_usage();
    return 1;
  }

  try {
    // Set up a 64 KB stdout buffer for batched writes
    static char stdout_buf[65536];
    setvbuf(stdout, stdout_buf, _IOFBF, sizeof(stdout_buf));

    // Song stream (optional)
    std::unique_ptr<FfmpegPcmStream> song_stream;
    int32_t song_vol_fixed = static_cast<int32_t>(song_volume * (1 << kFixedPointShift));

    if (!song_path.empty()) {
      song_stream = std::make_unique<FfmpegPcmStream>(
        TrackInput{song_path, song_volume, false, song_offset}
      );
    }

    // Ambient streams
    std::vector<std::unique_ptr<FfmpegPcmStream>> ambient_streams;
    ambient_streams.reserve(ambients.size());

    for (const auto& ambient : ambients) {
      ambient_streams.push_back(std::make_unique<FfmpegPcmStream>(
        TrackInput{ambient.path, ambient.volume, true, 0.0}
      ));
    }

    // Pre-allocate all buffers once
    std::vector<int16_t> song_chunk(kSamplesPerChunk, 0);
    std::vector<std::vector<int16_t>> ambient_chunks(ambient_streams.size());
    for (auto& chunk : ambient_chunks) {
      chunk.resize(kSamplesPerChunk, 0);
    }
    std::vector<int16_t> output_chunk(kSamplesPerChunk, 0);

    // Main mixing loop
    for (;;) {
      bool have_song_data = false;

      if (song_stream) {
        have_song_data = song_stream->read_chunk(song_chunk.data(), kSamplesPerChunk);
        if (!have_song_data) break;  // Song ended → done (non-ambient-only)
      }

      for (std::size_t ai = 0; ai < ambient_streams.size(); ++ai) {
        ambient_streams[ai]->read_chunk(ambient_chunks[ai].data(), kSamplesPerChunk);
      }

      // Fixed-point mixing
      for (std::size_t si = 0; si < kSamplesPerChunk; ++si) {
        int32_t mixed = 0;

        if (have_song_data) {
          mixed = (static_cast<int32_t>(song_chunk[si]) * song_vol_fixed) >> kFixedPointShift;
        }

        for (std::size_t ai = 0; ai < ambient_streams.size(); ++ai) {
          mixed += (static_cast<int32_t>(ambient_chunks[ai][si]) * ambient_streams[ai]->volume_fixed()) >> kFixedPointShift;
        }

        mixed = std::clamp(mixed, static_cast<int32_t>(-32768), static_cast<int32_t>(32767));
        output_chunk[si] = static_cast<int16_t>(mixed);
      }

      const std::size_t written = fwrite(
        output_chunk.data(),
        sizeof(int16_t),
        output_chunk.size(),
        stdout
      );

      if (written != output_chunk.size()) {
        break;  // Broken pipe or write error
      }

      // In ambient-only mode (no song), loop forever until write fails
    }
  } catch (const std::exception& error) {
    std::cerr << "audio_mixer error: " << error.what() << "\n";
    return 1;
  }

  return 0;
}

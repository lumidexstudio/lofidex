import os from "os";

interface Usage {
  memory: string;
  cpu: string;
}

const getUsage = (): Usage => {
  const usedMemory = os.totalmem() - os.freemem();
  const cpus = os.cpus();
  const avgs = cpus.map((cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b);
    const nonIdle = total - cpu.times.idle;
    return nonIdle / total;
  });

  return {
    memory: (usedMemory / Math.pow(1024, 3)).toFixed(2),
    cpu: (avgs.reduce((a, b) => a + b) / cpus.length).toFixed(2),
  };
};

export = getUsage;

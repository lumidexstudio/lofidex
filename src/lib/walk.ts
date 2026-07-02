import fs from "node:fs";
import path from "node:path";

function walk(
  dir: string,
  callback: (filepath: string, file: string, stats: fs.Stats) => void
): void {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walk(filepath, callback);
    } else if (stats.isFile()) {
      callback(filepath, file, stats);
    }
  });
}

export = walk;

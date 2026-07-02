"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function walk(dir, callback) {
    const files = node_fs_1.default.readdirSync(dir);
    files.forEach((file) => {
        const filepath = node_path_1.default.join(dir, file);
        const stats = node_fs_1.default.statSync(filepath);
        if (stats.isDirectory()) {
            walk(filepath, callback);
        }
        else if (stats.isFile()) {
            callback(filepath, file, stats);
        }
    });
}
module.exports = walk;
//# sourceMappingURL=walk.js.map
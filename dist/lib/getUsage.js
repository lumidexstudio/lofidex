"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const os_1 = __importDefault(require("os"));
const getUsage = () => {
    const usedMemory = os_1.default.totalmem() - os_1.default.freemem();
    const cpus = os_1.default.cpus();
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
module.exports = getUsage;
//# sourceMappingURL=getUsage.js.map
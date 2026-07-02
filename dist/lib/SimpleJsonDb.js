"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function deepClone(value) {
    if (value === undefined) {
        return undefined;
    }
    return JSON.parse(JSON.stringify(value));
}
function splitPath(key) {
    return String(key).split(".").filter(Boolean);
}
function getNestedValue(store, key) {
    const parts = splitPath(key);
    let current = store;
    for (const part of parts) {
        if (current == null ||
            typeof current !== "object" ||
            !(part in current)) {
            return undefined;
        }
        current = current[part];
    }
    return current;
}
function setNestedValue(store, key, value) {
    const parts = splitPath(key);
    let current = store;
    for (let index = 0; index < parts.length - 1; index += 1) {
        const part = parts[index];
        if (current[part] == null ||
            typeof current[part] !== "object" ||
            Array.isArray(current[part])) {
            current[part] = {};
        }
        current = current[part];
    }
    current[parts[parts.length - 1]] = value;
}
function deleteNestedValue(store, key) {
    const parts = splitPath(key);
    let current = store;
    for (let index = 0; index < parts.length - 1; index += 1) {
        const part = parts[index];
        if (current == null ||
            typeof current !== "object" ||
            !(part in current)) {
            return false;
        }
        current = current[part];
    }
    if (current == null || typeof current !== "object") {
        return false;
    }
    return delete current[parts[parts.length - 1]];
}
class SimpleJsonDb {
    filePath;
    store;
    constructor(filePath) {
        this.filePath = filePath;
        this.store = {};
        this.ensureLoaded();
    }
    ensureLoaded() {
        const dirPath = node_path_1.default.dirname(this.filePath);
        if (!node_fs_1.default.existsSync(dirPath)) {
            node_fs_1.default.mkdirSync(dirPath, { recursive: true });
        }
        if (!node_fs_1.default.existsSync(this.filePath)) {
            node_fs_1.default.writeFileSync(this.filePath, "{}", "utf8");
            this.store = {};
            return;
        }
        try {
            const content = node_fs_1.default.readFileSync(this.filePath, "utf8");
            this.store = content.trim() ? JSON.parse(content) : {};
        }
        catch {
            this.store = {};
        }
    }
    persist() {
        node_fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), "utf8");
    }
    async get(key) {
        return deepClone(getNestedValue(this.store, key));
    }
    async set(key, value) {
        setNestedValue(this.store, key, deepClone(value));
        this.persist();
        return value;
    }
    async has(key) {
        return getNestedValue(this.store, key) !== undefined;
    }
    async delete(key) {
        const deleted = deleteNestedValue(this.store, key);
        this.persist();
        return deleted;
    }
    async add(key, value) {
        const currentValue = await this.get(key);
        const nextValue = Number(currentValue ?? 0) + Number(value);
        await this.set(key, nextValue);
        return nextValue;
    }
}
module.exports = SimpleJsonDb;
//# sourceMappingURL=SimpleJsonDb.js.map
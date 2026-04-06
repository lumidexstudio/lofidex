const fs = require("node:fs");
const path = require("node:path");

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
    if (current == null || typeof current !== "object" || !(part in current)) {
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

    if (current[part] == null || typeof current[part] !== "object" || Array.isArray(current[part])) {
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

    if (current == null || typeof current !== "object" || !(part in current)) {
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
  constructor(filePath) {
    this.filePath = filePath;
    this.store = {};
    this.ensureLoaded();
  }

  ensureLoaded() {
    const dirPath = path.dirname(this.filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, "{}", "utf8");
      this.store = {};
      return;
    }

    try {
      const content = fs.readFileSync(this.filePath, "utf8");
      this.store = content.trim() ? JSON.parse(content) : {};
    } catch {
      this.store = {};
    }
  }

  persist() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), "utf8");
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

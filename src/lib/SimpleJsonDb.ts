import fs from "node:fs";
import path from "node:path";

function deepClone<T>(value: T): T | undefined {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function splitPath(key: string): string[] {
  return String(key).split(".").filter(Boolean);
}

function getNestedValue(
  store: Record<string, unknown>,
  key: string
): unknown {
  const parts = splitPath(key);
  let current: unknown = store;

  for (const part of parts) {
    if (
      current == null ||
      typeof current !== "object" ||
      !(part in (current as Record<string, unknown>))
    ) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function setNestedValue(
  store: Record<string, unknown>,
  key: string,
  value: unknown
): void {
  const parts = splitPath(key);
  let current: Record<string, unknown> = store;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];

    if (
      current[part] == null ||
      typeof current[part] !== "object" ||
      Array.isArray(current[part])
    ) {
      current[part] = {};
    }

    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

function deleteNestedValue(
  store: Record<string, unknown>,
  key: string
): boolean {
  const parts = splitPath(key);
  let current: Record<string, unknown> = store;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];

    if (
      current == null ||
      typeof current !== "object" ||
      !(part in current)
    ) {
      return false;
    }

    current = current[part] as Record<string, unknown>;
  }

  if (current == null || typeof current !== "object") {
    return false;
  }

  return delete current[parts[parts.length - 1]];
}

class SimpleJsonDb {
  filePath: string;
  store: Record<string, unknown>;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.store = {};
    this.ensureLoaded();
  }

  ensureLoaded(): void {
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

  persist(): void {
    fs.writeFileSync(
      this.filePath,
      JSON.stringify(this.store, null, 2),
      "utf8"
    );
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    return deepClone(getNestedValue(this.store, key)) as T | undefined;
  }

  async set<T = unknown>(key: string, value: T): Promise<T> {
    setNestedValue(this.store, key, deepClone(value));
    this.persist();
    return value;
  }

  async has(key: string): Promise<boolean> {
    return getNestedValue(this.store, key) !== undefined;
  }

  async delete(key: string): Promise<boolean> {
    const deleted = deleteNestedValue(this.store, key);
    this.persist();
    return deleted;
  }

  async add(key: string, value: number): Promise<number> {
    const currentValue = await this.get<number>(key);
    const nextValue = Number(currentValue ?? 0) + Number(value);
    await this.set(key, nextValue);
    return nextValue;
  }
}

export = SimpleJsonDb;

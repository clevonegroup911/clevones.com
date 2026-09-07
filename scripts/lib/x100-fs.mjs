import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function readJsonFile(filePath) {
  const absolute = resolve(filePath);
  const raw = readFileSync(absolute, "utf8");
  try {
    return { ok: true, data: JSON.parse(raw), raw, path: absolute };
  } catch (error) {
    return {
      ok: false,
      error: `JSON invalide: ${error instanceof Error ? error.message : String(error)}`,
      path: absolute,
    };
  }
}

export function writeJsonFile(filePath, data) {
  writeFileSync(resolve(filePath), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function readTextFile(filePath) {
  return readFileSync(resolve(filePath), "utf8");
}

export function isCliEntry(metaUrl, argv1 = process.argv[1]) {
  if (!argv1) {
    return false;
  }
  return resolve(argv1) === fileURLToPath(metaUrl);
}

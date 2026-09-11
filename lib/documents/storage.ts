import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const DEFAULT_ROOT = ".data/private-documents";

export type StoredObject = {
  key: string;
  absolutePath: string;
  sizeBytes: number;
  checksumSha256: string;
};

function storageRoot(): string {
  const configured = process.env.PRIVATE_DOCUMENT_ROOT?.trim();
  const root = configured && configured.length > 0 ? configured : DEFAULT_ROOT;
  const absolute = resolve(process.cwd(), root);
  if (absolute.includes(`${resolve(process.cwd(), "public")}`)) {
    throw new Error("Private document storage must not use public/.");
  }
  return absolute;
}

export function buildStorageKey(fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  return `${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safe}`;
}

export async function putPrivateObject(
  key: string,
  bytes: Buffer,
): Promise<StoredObject> {
  const absolutePath = join(storageRoot(), key);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes, { mode: 0o600 });
  return {
    key,
    absolutePath,
    sizeBytes: bytes.byteLength,
    checksumSha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export async function readPrivateObject(key: string): Promise<Buffer> {
  const absolutePath = join(storageRoot(), key);
  return readFile(absolutePath);
}

export async function deletePrivateObject(key: string): Promise<void> {
  const absolutePath = join(storageRoot(), key);
  try {
    await unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

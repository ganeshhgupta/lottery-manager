import fs from "fs/promises";
import path from "path";
import { AppData } from "./types";

const BUNDLE_PATH = path.join(process.cwd(), "lib", "data.json");
const TMP_PATH = "/tmp/lottery-data.json";
const BLOB_FILENAME = "lottery-data.json";

// ─── Vercel Blob helpers (only imported when token is present) ───────────────

let blobUrl: string | null = null;

async function blobRead(): Promise<AppData | null> {
  try {
    const { list, put } = await import("@vercel/blob");

    if (!blobUrl) {
      const { blobs } = await list({ prefix: BLOB_FILENAME, limit: 1 });
      if (blobs.length > 0) {
        blobUrl = blobs[0].url;
      } else {
        // First boot: seed blob from bundle
        const seed = JSON.parse(await fs.readFile(BUNDLE_PATH, "utf-8")) as AppData;
        const result = await put(BLOB_FILENAME, JSON.stringify(seed), {
          access: "public",
          contentType: "application/json",
          addRandomSuffix: false,
        });
        blobUrl = result.url;
        return seed;
      }
    }

    const res = await fetch(blobUrl, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json() as AppData;
    if (!data.ticketCatalog) {
      const bundle = JSON.parse(await fs.readFile(BUNDLE_PATH, "utf-8")) as AppData;
      data.ticketCatalog = bundle.ticketCatalog ?? [];
    }
    return data;
  } catch {
    return null;
  }
}

async function blobWrite(data: AppData): Promise<void> {
  const { put } = await import("@vercel/blob");
  const result = await put(BLOB_FILENAME, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  blobUrl = result.url;
}

// ─── Local file-system helpers (dev + Vercel /tmp fallback) ─────────────────

async function getLocalPath(): Promise<string> {
  if (process.platform === "win32") return BUNDLE_PATH;
  try {
    await fs.access(TMP_PATH);
    return TMP_PATH;
  } catch {
    const seed = await fs.readFile(BUNDLE_PATH, "utf-8");
    await fs.writeFile(TMP_PATH, seed, "utf-8");
    return TMP_PATH;
  }
}

async function localRead(): Promise<AppData> {
  const p = await getLocalPath();
  const raw = await fs.readFile(p, "utf-8");
  const data = JSON.parse(raw) as AppData;
  if (!data.ticketCatalog) {
    const bundle = JSON.parse(await fs.readFile(BUNDLE_PATH, "utf-8")) as AppData;
    data.ticketCatalog = bundle.ticketCatalog ?? [];
  }
  return data;
}

async function localWrite(data: AppData): Promise<void> {
  const p = await getLocalPath();
  await fs.writeFile(p, JSON.stringify(data, null, 2), "utf-8");
}

// ─── Public API ──────────────────────────────────────────────────────────────

const hasBlobToken = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// Simple async mutex to prevent concurrent write races
let writeLock: Promise<void> = Promise.resolve();

export async function readData(): Promise<AppData> {
  if (hasBlobToken()) {
    const data = await blobRead();
    if (data) return data;
    // Blob read failed — fall through to local
  }
  return localRead();
}

export async function writeData(data: AppData): Promise<void> {
  const current = writeLock;
  let release!: () => void;
  writeLock = new Promise<void>((resolve) => { release = resolve; });
  await current;
  try {
    if (hasBlobToken()) {
      await blobWrite(data);
    } else {
      await localWrite(data);
    }
  } finally {
    release();
  }
}

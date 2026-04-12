import fs from "fs/promises";
import path from "path";
import { AppData } from "./types";

const BUNDLE_PATH = path.join(process.cwd(), "lib", "data.json");
const TMP_PATH = "/tmp/lottery-data.json";

// On Vercel, process.cwd() is read-only. We copy the seed file to /tmp on
// first access and use that as the live data store for the container lifetime.
async function getDataPath(): Promise<string> {
  // On Windows / local dev, write directly next to the bundle
  if (process.platform === "win32") return BUNDLE_PATH;

  try {
    await fs.access(TMP_PATH);
    return TMP_PATH;
  } catch {
    // /tmp copy doesn't exist yet — seed it from the bundle
    const bundleData = await fs.readFile(BUNDLE_PATH, "utf-8");
    await fs.writeFile(TMP_PATH, bundleData, "utf-8");
    return TMP_PATH;
  }
}

// Simple async mutex to prevent concurrent write races
let writeLock: Promise<void> = Promise.resolve();

export async function readData(): Promise<AppData> {
  const dataPath = await getDataPath();
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw) as AppData;
}

export async function writeData(data: AppData): Promise<void> {
  const dataPath = await getDataPath();
  const current = writeLock;
  let release!: () => void;
  writeLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await current;
  try {
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8");
  } finally {
    release();
  }
}

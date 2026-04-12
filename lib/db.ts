import fs from "fs/promises";
import path from "path";
import { AppData } from "./types";

const DATA_PATH = path.join(process.cwd(), "lib", "data.json");

// Simple async mutex to prevent concurrent write races
let writeLock: Promise<void> = Promise.resolve();

export async function readData(): Promise<AppData> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw) as AppData;
}

export async function writeData(data: AppData): Promise<void> {
  const current = writeLock;
  let release!: () => void;
  writeLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await current;
  try {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  } finally {
    release();
  }
}

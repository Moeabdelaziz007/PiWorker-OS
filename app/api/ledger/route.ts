import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const LEDGER_PATH = path.join(process.cwd(), "core/identity/sovereign-ledger.jsonl");

export async function GET() {
  try {
    const data = await fs.readFile(LEDGER_PATH, "utf-8");
    const lines = data.trim().split("\n");
    const entries = lines.map(line => JSON.parse(line));
    
    // Return last 20 entries for the dashboard
    return NextResponse.json(entries.slice(-20));
  } catch (error) {
    return NextResponse.json({ error: "LEDGER_EMPTY_OR_NOT_FOUND" }, { status: 404 });
  }
}

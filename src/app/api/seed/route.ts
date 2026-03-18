import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST() {
  try {
    execSync("npm run seed", { cwd: process.cwd(), timeout: 30000 });
    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}

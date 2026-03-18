/**
 * Push local SQLite data to Turso.
 * Usage: TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npx tsx src/db/push-to-turso.ts
 */
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "data", "health-plan.db");
if (!fs.existsSync(dbPath)) {
  console.error("Local database not found. Run `npm run seed` first.");
  process.exit(1);
}

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
  console.error("TURSO_DATABASE_URL is required");
  process.exit(1);
}

async function pushToTurso() {
  const local = new Database(dbPath);
  const turso = createClient({ url: tursoUrl!, authToken: tursoToken });

  // Get all CREATE TABLE statements from local DB
  const tables = local
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { sql: string }[];

  // Create tables in Turso
  for (const { sql } of tables) {
    if (sql) {
      await turso.execute(sql);
      console.log(`Created table: ${sql.match(/CREATE TABLE.*?"?(\w+)"?/)?.[1]}`);
    }
  }

  // Get table names
  const tableNames = local
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];

  // Copy data for each table
  for (const { name } of tableNames) {
    const rows = local.prepare(`SELECT * FROM "${name}"`).all() as Record<string, unknown>[];
    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => "?").join(", ");
    const insertSql = `INSERT INTO "${name}" (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders})`;

    // Batch insert in chunks of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const statements = batch.map((row) => ({
        sql: insertSql,
        args: columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return null;
          return val as string | number;
        }),
      }));
      await turso.batch(statements);
    }

    console.log(`  ${name}: ${rows.length} rows`);
  }

  local.close();
  console.log("\nDone! Data pushed to Turso.");
}

pushToTurso().catch(console.error);

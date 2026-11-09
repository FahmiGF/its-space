import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { requireDatabaseUrl } from "./env.mjs";

const { Client } = pg;
const url = requireDatabaseUrl();
const schema = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
const client = new Client({ connectionString: url });

try {
  await client.connect();
  await client.query(schema);
  const { rows } = await client.query("select version() as version");
  console.log(`Schema applied to PostgreSQL: ${rows[0].version.split(",")[0]}`);
} finally {
  await client.end();
}

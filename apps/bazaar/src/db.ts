import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import type { BazaarEntry, DiscoverQuery } from "@agent-bazaar/common";

// SQLite stores healthy as INTEGER (0/1), so we need a raw row type
type DbRow = Omit<BazaarEntry, "healthy"> & { healthy: number };

const DB_PATH = process.env.DB_PATH || "bazaar.db";

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema(): void {
  getDbRaw().exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      path TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'POST',
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price_usd TEXT NOT NULL,
      network TEXT NOT NULL DEFAULT 'stellar:testnet',
      asset TEXT NOT NULL DEFAULT 'USDC',
      pay_to TEXT NOT NULL,
      input_schema TEXT,
      output_schema TEXT,
      tags TEXT,
      registered_at TEXT NOT NULL,
      last_health_check TEXT,
      healthy INTEGER NOT NULL DEFAULT 1,
      source TEXT NOT NULL DEFAULT 'manual'
    );

    CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
    CREATE INDEX IF NOT EXISTS idx_services_healthy ON services(healthy);
    CREATE INDEX IF NOT EXISTS idx_services_price ON services(price_usd);
  `);
}

function getDbRaw(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function registerService(
  entry: Omit<BazaarEntry, "id" | "registered_at" | "last_health_check" | "healthy"> & {
    source?: string;
  },
): string {
  const id = randomUUID();
  const now = new Date().toISOString();

  getDb()
    .prepare(
      `INSERT INTO services (id, url, path, method, name, description, category, price_usd, network, asset, pay_to, input_schema, output_schema, tags, registered_at, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      entry.url,
      entry.path,
      entry.method || "POST",
      entry.name,
      entry.description,
      entry.category,
      entry.price_usd,
      entry.network || "stellar:testnet",
      entry.asset || "USDC",
      entry.pay_to,
      entry.input_schema ? JSON.stringify(entry.input_schema) : null,
      entry.output_schema ? JSON.stringify(entry.output_schema) : null,
      Array.isArray(entry.tags) ? entry.tags : entry.tags || null,
      now,
      entry.source || "manual",
    );

  return id;
}

export function discoverServices(query?: DiscoverQuery): BazaarEntry[] {
  let sql = "SELECT * FROM services WHERE 1=1";
  const params: unknown[] = [];

  if (query?.category) {
    sql += " AND category = ?";
    params.push(query.category);
  }

  if (query?.max_price) {
    sql += " AND CAST(price_usd AS REAL) <= CAST(? AS REAL)";
    params.push(query.max_price);
  }

  if (query?.healthy !== undefined) {
    sql += " AND healthy = ?";
    params.push(query.healthy ? 1 : 0);
  }

  if (query?.tags) {
    const tagList = query.tags.split(",").map((t) => t.trim());
    for (const tag of tagList) {
      sql += " AND tags LIKE ?";
      params.push(`%${tag}%`);
    }
  }

  sql += " ORDER BY CAST(price_usd AS REAL) ASC";

  const rows = getDb().prepare(sql).all(...params) as DbRow[];
  return rows.map((r) => ({ ...r, healthy: r.healthy === 1 }));
}

export function getAllServices(): BazaarEntry[] {
  const rows = getDb().prepare("SELECT * FROM services ORDER BY registered_at DESC").all() as DbRow[];
  return rows.map((r) => ({ ...r, healthy: r.healthy === 1 }));
}

export function getServiceById(id: string): BazaarEntry | undefined {
  const row = getDb().prepare("SELECT * FROM services WHERE id = ?").get(id) as DbRow | undefined;
  return row ? { ...row, healthy: row.healthy === 1 } : undefined;
}

export function upsertServiceByUrl(
  url: string,
  path: string,
  entry: Omit<BazaarEntry, "id" | "registered_at" | "last_health_check" | "healthy">,
): string {
  const existing = getDb()
    .prepare("SELECT id FROM services WHERE url = ? AND path = ?")
    .get(url, path) as { id: string } | undefined;

  if (existing) {
    getDb()
      .prepare(
        `UPDATE services SET name=?, description=?, category=?, price_usd=?, network=?, asset=?, pay_to=?, method=?, source=? WHERE id=?`,
      )
      .run(
        entry.name,
        entry.description,
        entry.category,
        entry.price_usd,
        entry.network,
        entry.asset,
        entry.pay_to,
        entry.method,
        entry.source,
        existing.id,
      );
    return existing.id;
  }

  return registerService(entry);
}

export function updateHealthStatus(id: string, healthy: boolean): void {
  getDb()
    .prepare(
      "UPDATE services SET healthy = ?, last_health_check = ? WHERE id = ?",
    )
    .run(healthy ? 1 : 0, new Date().toISOString(), id);
}

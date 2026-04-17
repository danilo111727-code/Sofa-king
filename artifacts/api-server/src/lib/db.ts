import pg from "pg";
const { Pool } = pg;

let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  }
  return _pool;
}

export async function dbQuery(sql: string, params: any[] = []): Promise<pg.QueryResult | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    return await pool.query(sql, params);
  } catch (err) {
    console.error("[db] Query error:", err);
    return null;
  }
}

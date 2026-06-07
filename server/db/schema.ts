import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'letschat',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err);
});

export const db = {
  async run(sql: string, params: any[] = []): Promise<void> {
    await pool.query(sql, params);
  },

  async get(sql: string, params: any[] = []): Promise<any> {
    const result = await pool.query(sql, params);
    return result.rows[0] ?? undefined;
  },

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const result = await pool.query(sql, params);
    return result.rows;
  },
};

export async function initializeDatabase(): Promise<void> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           TEXT PRIMARY KEY,
        username     TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        avatar_url   TEXT,
        password_hash TEXT NOT NULL,
        last_seen    BIGINT DEFAULT 0,
        public_key   TEXT,
        refresh_token TEXT,
        created_at   BIGINT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id          TEXT PRIMARY KEY,
        chat_id     TEXT NOT NULL,
        sender_id   TEXT NOT NULL,
        content     TEXT NOT NULL,
        type        TEXT NOT NULL DEFAULT 'text',
        media_url   TEXT,
        status      TEXT NOT NULL DEFAULT 'sent',
        reply_to    TEXT,
        created_at  BIGINT,
        deleted_for TEXT DEFAULT '[]'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        message_id TEXT NOT NULL,
        user_id    TEXT NOT NULL,
        emoji      TEXT NOT NULL,
        created_at BIGINT,
        PRIMARY KEY (message_id, user_id)
      )
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_chat_id      ON messages(chat_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON messages(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_sender_id    ON messages(sender_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at)');

    console.log('[DB] PostgreSQL schema initialized');
  } finally {
    client.release();
  }
}

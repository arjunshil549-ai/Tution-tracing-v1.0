import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();

export const db = drizzle(pool, { schema });

// Auto-migration helper to ensure all tables & columns exist without breaking existing data
export async function initializeDatabaseSchema() {
  try {
    const client = await pool.connect();
    try {
      // 1. Ensure basic tables exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          uid TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL,
          name TEXT,
          phone TEXT,
          institution TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS tuitions (
          id SERIAL PRIMARY KEY,
          user_uid TEXT NOT NULL REFERENCES users(uid),
          name TEXT NOT NULL,
          student_name TEXT,
          address TEXT NOT NULL,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          radius INTEGER NOT NULL DEFAULT 100,
          expected_start TEXT NOT NULL,
          expected_end TEXT NOT NULL,
          fee INTEGER NOT NULL DEFAULT 0,
          expected_classes_per_month INTEGER NOT NULL DEFAULT 10,
          scheduled_days TEXT NOT NULL DEFAULT '[]',
          minimum_stay_minutes INTEGER NOT NULL DEFAULT 30,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS attendance (
          id SERIAL PRIMARY KEY,
          user_uid TEXT NOT NULL REFERENCES users(uid),
          tuition_id INTEGER REFERENCES tuitions(id) ON DELETE SET NULL,
          date TEXT NOT NULL,
          arrival_time TEXT NOT NULL,
          departure_time TEXT,
          duration INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'completed',
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // 2. Safely add new columns if they don't exist yet
      await client.query(`
        ALTER TABLE tuitions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE attendance ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'WEB';
        ALTER TABLE attendance ADD COLUMN IF NOT EXISTS client_event_id TEXT;
        ALTER TABLE attendance ADD COLUMN IF NOT EXISTS arrival_latitude DOUBLE PRECISION;
        ALTER TABLE attendance ADD COLUMN IF NOT EXISTS arrival_longitude DOUBLE PRECISION;
        ALTER TABLE attendance ADD COLUMN IF NOT EXISTS arrival_accuracy DOUBLE PRECISION;
        ALTER TABLE attendance ADD COLUMN IF NOT EXISTS departure_latitude DOUBLE PRECISION;
        ALTER TABLE attendance ADD COLUMN IF NOT EXISTS departure_longitude DOUBLE PRECISION;
        ALTER TABLE attendance ADD COLUMN IF NOT EXISTS departure_accuracy DOUBLE PRECISION;
        ALTER TABLE attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

        -- Index for fast user attendance and sync lookups
        CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_uid, date);
        CREATE INDEX IF NOT EXISTS idx_attendance_client_event_id ON attendance(client_event_id);
      `);
      console.log('PostgreSQL schema migration completed successfully.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('Database auto-migration notice (if running without cloud database, fallback mode active):', err.message);
  }
}

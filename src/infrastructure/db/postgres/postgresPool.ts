import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export const postgresPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
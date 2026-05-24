import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL not defined in .env');
}

export const pool = new Pool({
  connectionString,
});

export const connectDB = async () => {
  await pool.connect();
  console.log('Connected to PostgreSQL');
};

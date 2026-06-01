import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.APPUSER_USER,
  password: process.env.APPUSER_PASSWORD,
});

export const getPoolProvider = () => pool;

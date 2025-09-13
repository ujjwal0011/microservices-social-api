import pg from "pg";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  logger.verbose("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  logger.critical("Unexpected error on idle client", err);
});

export const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.verbose("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.critical("Database query error", error);
    throw error;
  }
};

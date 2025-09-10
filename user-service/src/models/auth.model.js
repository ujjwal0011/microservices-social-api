import { query } from "../utils/database.js";
import bcrypt from "bcryptjs";

export const createUser = async ({ username, email, password, full_name }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await query(
    `   INSERT INTO users (username, email, password_hash, full_name) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, username, email, full_name, created_at    `,
    [username, email, hashedPassword, full_name]
  );

  return result.rows[0];
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

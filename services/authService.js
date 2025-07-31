// services/authService.js
import bcrypt from 'bcrypt';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPromise = open({
  filename: './data/dashboard_users.sqlite',
  driver: sqlite3.Database
});

export async function initDb() {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);
}

export async function createUser(username, password) {
  const db = await dbPromise;
  const password_hash = await bcrypt.hash(password, 10);
  await db.run(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)',
    [username, password_hash]
  );
}

export async function verifyUser(username, password) {
  const db = await dbPromise;
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password_hash);
  return isValid ? user : null;
}
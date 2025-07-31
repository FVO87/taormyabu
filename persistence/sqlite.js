// sqlite.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

const SQLITE_ENABLED = process.env.PERSIST_THREADS_SQLITE === 'true';
const DB_PATH = process.env.SQLITE_PATH || './data/bot.db';

let db = null;

async function init() {
  if (!SQLITE_ENABLED) return null;

  try {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS threads (
        user_id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.warn('[SQLite] Falha ao inicializar DB. Fallback para memória:', err.message);
    db = null;
  }
}

await init();

export async function getThreadId(user_id) {
  if (!db) return null;
  try {
    const result = await db.get('SELECT thread_id FROM threads WHERE user_id = ?', user_id);
    return result?.thread_id || null;
  } catch (err) {
    console.warn('[SQLite] Erro ao buscar thread_id:', err.message);
    return null;
  }
}

export async function saveThreadId(user_id, thread_id) {
  if (!db) return;
  try {
    await db.run(`
      INSERT INTO threads (user_id, thread_id, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        thread_id=excluded.thread_id,
        updated_at=CURRENT_TIMESTAMP
    `, user_id, thread_id);
  } catch (err) {
    console.warn('[SQLite] Erro ao salvar thread_id:', err.message);
  }
}

// --- FUNÇÃO ADICIONADA ---
// Função para apagar um threadId da base de dados
export async function deleteThreadId(user_id) {
    if (!db) return;
    try {
        await db.run('DELETE FROM threads WHERE user_id = ?', user_id);
        console.log(`[SQLite] Thread ID para ${user_id} foi apagado.`);
    } catch (err) {
        console.warn('[SQLite] Erro ao apagar thread_id:', err.message);
    }
}

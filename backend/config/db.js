import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import { spawn } from 'child_process';
import { executeMockQuery } from './mockStore.js';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'eldercare_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  connectTimeout: 2500 // Fast timeout so server doesn't hang when MySQL is off
};

let pool = null;
let isMySqlAvailable = false;
let hasCheckedMySql = false;
let isStartingMySql = false;

export function isDbConnected() {
  return isMySqlAvailable;
}

export async function tryAutoStartMySql() {
  if (isStartingMySql || process.platform !== 'win32') return false;
  const isLocal = ['localhost', '127.0.0.1'].includes(dbConfig.host);
  if (!isLocal) return false;

  const candidatePaths = [
    { exe: 'C:\\xampp\\mysql\\bin\\mysqld.exe', ini: 'mysql\\bin\\my.ini', cwd: 'C:\\xampp' },
    { exe: 'D:\\xampp\\mysql\\bin\\mysqld.exe', ini: 'mysql\\bin\\my.ini', cwd: 'D:\\xampp' }
  ];

  const found = candidatePaths.find(p => fs.existsSync(p.exe));
  if (!found) return false;

  try {
    isStartingMySql = true;
    console.log('[DB] MySQL is currently offline. Auto-starting XAMPP MySQL...');
    const child = spawn(found.exe, [`--defaults-file=${found.ini}`, '--standalone'], {
      cwd: found.cwd,
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    child.unref();

    // Poll up to 6 seconds for MySQL port to open
    for (let i = 0; i < 12; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const testConn = await mysql.createConnection({
          host: dbConfig.host,
          user: dbConfig.user,
          password: dbConfig.password,
          port: dbConfig.port,
          connectTimeout: 1000
        });
        await testConn.query('SELECT 1');
        await testConn.end();
        console.log('[DB] Auto-started XAMPP MySQL successfully!');
        return true;
      } catch {}
    }
  } catch (err) {
    console.warn('[DB] Failed to auto-start MySQL:', err.message);
  } finally {
    isStartingMySql = false;
  }
  return false;
}

export async function testConnection() {
  try {
    const conn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
      connectTimeout: 2500
    });
    await conn.query('SELECT 1');
    await conn.end();
    isMySqlAvailable = true;
    if (!pool) {
      pool = mysql.createPool(dbConfig);
    }
    return true;
  } catch {
    const started = await tryAutoStartMySql();
    if (started) {
      isMySqlAvailable = true;
      if (!pool) {
        pool = mysql.createPool(dbConfig);
      }
      return true;
    }
    isMySqlAvailable = false;
    return false;
  } finally {
    hasCheckedMySql = true;
  }
}

// Background auto-reconnect check every 30 seconds
setInterval(async () => {
  try {
    const available = await testConnection();
    if (available && !pool) {
      pool = mysql.createPool(dbConfig);
    }
  } catch {}
}, 30000);

export function getPool() {
  if (!pool && isMySqlAvailable) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function query(sql, params = []) {
  if (!hasCheckedMySql) {
    await testConnection();
  }

  if (isMySqlAvailable) {
    try {
      const p = getPool();
      if (p) {
        const [results] = await p.execute(sql, params);
        return results;
      }
    } catch (err) {
      // If MySQL connection drops or table doesn't exist, fall back to mock
      if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ER_NO_SUCH_TABLE') {
        isMySqlAvailable = false;
      } else {
        throw err;
      }
    }
  }

  // Graceful in-memory fallback
  return executeMockQuery(sql, params);
}

export default { getPool, query, isDbConnected, testConnection };

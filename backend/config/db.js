import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import { spawn } from 'child_process';
import { executeMockQuery } from './mockStore.js';

dotenv.config();

/**
 * Resolves database configuration from environment variables.
 * Supports:
 * - DATABASE_URL / MYSQL_URL (e.g. mysql://user:pass@host:port/dbname?ssl=true)
 * - Standard DB_* variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DB_SSL)
 * - Cloud provider aliases (MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT)
 */
export function getDatabaseConfig() {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
  const connString = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (connString) {
    try {
      const parsed = new URL(connString);
      const isSslRequested =
        process.env.DB_SSL === 'true' ||
        parsed.searchParams.get('ssl') === 'true' ||
        parsed.searchParams.get('sslmode') === 'require' ||
        isProduction;

      return {
        host: parsed.hostname,
        port: Number(parsed.port) || 3306,
        user: decodeURIComponent(parsed.username || 'root'),
        password: decodeURIComponent(parsed.password || ''),
        database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : (process.env.DB_NAME || 'eldercare_db'),
        ssl: isSslRequested ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
        connectTimeout: 8000,
        isConfigured: true,
        hasRemoteHost: true,
        source: 'connection-string'
      };
    } catch (err) {
      console.warn('[DB] Failed to parse DATABASE_URL / MYSQL_URL:', err.message);
    }
  }

  const host = process.env.DB_HOST || process.env.MYSQLHOST;
  const user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
  const password = process.env.DB_PASSWORD !== undefined
    ? process.env.DB_PASSWORD
    : (process.env.MYSQLPASSWORD !== undefined ? process.env.MYSQLPASSWORD : '');
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'eldercare_db';
  const port = Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306;

  const hasRemoteHost = Boolean(host && host !== 'localhost' && host !== '127.0.0.1');
  const isConfigured = hasRemoteHost || (!isProduction && Boolean(host));
  const enableSsl = process.env.DB_SSL === 'true' || (isProduction && hasRemoteHost);

  return {
    host: host || 'localhost',
    user: user,
    password: password,
    database: database,
    port: port,
    ssl: enableSsl ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    connectTimeout: 5000,
    isConfigured: Boolean(isConfigured),
    hasRemoteHost,
    source: hasRemoteHost ? 'env-vars' : 'default-localhost'
  };
}

let pool = null;
let isMySqlAvailable = false;
let hasCheckedMySql = false;
let isStartingMySql = false;
let hasLoggedProdWarning = false;

export function isDbConnected() {
  return isMySqlAvailable;
}

export async function tryAutoStartMySql() {
  if (isStartingMySql || process.platform !== 'win32') return false;
  const config = getDatabaseConfig();
  const isLocal = ['localhost', '127.0.0.1'].includes(config.host);
  if (!isLocal) return false;

  const candidatePaths = [
    { exe: 'C:\\xampp\\mysql\\bin\\mysqld.exe', ini: 'mysql\\bin\\my.ini', cwd: 'C:\\xampp' },
    { exe: 'D:\\xampp\\mysql\\bin\\mysqld.exe', ini: 'mysql\\bin\\my.ini', cwd: 'D:\\xampp' }
  ];

  const found = candidatePaths.find(p => fs.existsSync(p.exe));
  if (!found) return false;

  try {
    isStartingMySql = true;
    console.log('[DB] Local MySQL is currently offline. Auto-starting XAMPP MySQL...');
    const child = spawn(found.exe, [`--defaults-file=${found.ini}`, '--standalone'], {
      cwd: found.cwd,
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    child.unref();

    for (let i = 0; i < 12; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const testConn = await mysql.createConnection({
          host: config.host,
          user: config.user,
          password: config.password,
          port: config.port,
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
  const config = getDatabaseConfig();
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

  // In production, if no remote database host is configured (defaults to localhost),
  // do not hang trying to connect to localhost:3306 on Render container.
  if (isProduction && !config.hasRemoteHost) {
    if (!hasLoggedProdWarning) {
      console.warn('========================================================================');
      console.warn('[DB] WARNING: No production MySQL database configured on Render.');
      console.warn('[DB] Current host is localhost:3306, but Render containers do not run MySQL.');
      console.warn('[DB] Required Render Environment Variables for persistent MySQL storage:');
      console.warn('[DB]   - DB_HOST (e.g. from TiDB Cloud, Aiven, Railway, AWS RDS, PlanetScale)');
      console.warn('[DB]   - DB_USER');
      console.warn('[DB]   - DB_PASSWORD');
      console.warn('[DB]   - DB_NAME');
      console.warn('[DB]   - DB_PORT (usually 3306)');
      console.warn('[DB]   - DB_SSL (true if required by cloud provider)');
      console.warn('[DB]   - OR DATABASE_URL (mysql://user:pass@host:port/dbname)');
      console.warn('========================================================================');
      hasLoggedProdWarning = true;
    }
    isMySqlAvailable = false;
    hasCheckedMySql = true;
    return false;
  }

  try {
    const conn = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port,
      ssl: config.ssl,
      connectTimeout: config.connectTimeout
    });
    await conn.query('SELECT 1');
    await conn.end();
    isMySqlAvailable = true;
    if (!pool) {
      pool = mysql.createPool(extractPoolOptions(config));
    }
    return true;
  } catch (err) {
    // If local development, try auto-starting XAMPP
    if (!isProduction) {
      const started = await tryAutoStartMySql();
      if (started) {
        isMySqlAvailable = true;
        if (!pool) {
          pool = mysql.createPool(extractPoolOptions(config));
        }
        return true;
      }
    } else {
      console.warn(`[DB] Failed to connect to MySQL at ${config.host}:${config.port}:`, err.message);
    }
    isMySqlAvailable = false;
    return false;
  } finally {
    hasCheckedMySql = true;
  }
}

function extractPoolOptions(config) {
  return {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl,
    waitForConnections: config.waitForConnections ?? true,
    connectionLimit: config.connectionLimit ?? 10,
    queueLimit: config.queueLimit ?? 0,
    charset: config.charset || 'utf8mb4',
    connectTimeout: config.connectTimeout || 5000
  };
}

// Auto-reconnect check every 30 seconds
setInterval(async () => {
  try {
    const config = getDatabaseConfig();
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
    if (isProduction && !config.hasRemoteHost) return;

    const available = await testConnection();
    if (available && !pool) {
      pool = mysql.createPool(extractPoolOptions(config));
    }
  } catch {}
}, 30000);

export function getPool() {
  const config = getDatabaseConfig();
  if (!pool && isMySqlAvailable) {
    pool = mysql.createPool(extractPoolOptions(config));
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
      if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ER_NO_SUCH_TABLE') {
        isMySqlAvailable = false;
      } else {
        throw err;
      }
    }
  }

  // In production, NEVER silently switch to in-memory storage or claim persistence
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
  if (isProduction) {
    const error = new Error(
      'Database connection unavailable: MySQL is not connected. Please configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (or DATABASE_URL) in your Render environment variables.'
    );
    error.code = 'DATABASE_UNAVAILABLE';
    error.status = 503;
    throw error;
  }

  // Graceful in-memory fallback strictly for local development testing
  return executeMockQuery(sql, params);
}

export default { getPool, query, isDbConnected, testConnection, getDatabaseConfig };

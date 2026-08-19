const { neon } = require('@neondatabase/serverless');

function db() {
  if (!process.env.DATABASE_URL) {
    const err = new Error('DATABASE_URL fehlt. Bitte eine PostgreSQL-Datenbank in Vercel verbinden.');
    err.code = 'DB_NOT_CONFIGURED';
    throw err;
  }
  return neon(process.env.DATABASE_URL);
}

function json(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function method(req, allowed) {
  if (!allowed.includes(req.method)) return false;
  return true;
}

async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 1_000_000) reject(new Error('Payload too large')); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Ungültiges JSON')); } });
    req.on('error', reject);
  });
}

module.exports = { db, json, method, body };

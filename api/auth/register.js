const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, json, body } = require('../_db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const input = await body(req);
    const name = String(input.name || '').trim();
    const email = String(input.email || '').trim().toLowerCase();
    const password = String(input.password || '');
    if (name.length < 2) return json(res, 400, { error: 'Name ist zu kurz.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { error: 'Ungültige E-Mail-Adresse.' });
    if (password.length < 8) return json(res, 400, { error: 'Passwort muss mindestens 8 Zeichen haben.' });

    const sql = db();
    await sql`CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    const existing = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
    if (existing.length) return json(res, 409, { error: 'E-Mail ist bereits registriert.' });
    const hash = await bcrypt.hash(password, 12);
    const rows = await sql`INSERT INTO users (name,email,password_hash) VALUES (${name},${email},${hash}) RETURNING id,name,email,created_at`;
    const user = rows[0];
    if (!process.env.JWT_SECRET) return json(res, 500, { error: 'JWT_SECRET fehlt in Vercel.' });
    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.setHeader('Set-Cookie', `residia24_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
    return json(res, 201, { user });
  } catch (e) {
    return json(res, 500, { error: e.code === 'DB_NOT_CONFIGURED' ? e.message : 'Registrierung fehlgeschlagen.' });
  }
};

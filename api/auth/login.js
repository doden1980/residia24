const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, json, body } = require('../_db');

module.exports = async (req,res)=>{
  if(req.method!=='POST') return json(res,405,{error:'Method not allowed'});
  try{
    const input=await body(req);
    const email=String(input.email||'').trim().toLowerCase();
    const password=String(input.password||'');
    if(!email||!password) return json(res,400,{error:'E-Mail und Passwort sind erforderlich.'});
    const sql=db();
    await sql`CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    const rows=await sql`SELECT id,name,email,password_hash FROM users WHERE email=${email} LIMIT 1`;
    if(!rows.length || !(await bcrypt.compare(password,rows[0].password_hash))) return json(res,401,{error:'E-Mail oder Passwort falsch.'});
    if(!process.env.JWT_SECRET)return json(res,500,{error:'JWT_SECRET fehlt in Vercel.'});
    const user={id:rows[0].id,name:rows[0].name,email:rows[0].email};
    const token=jwt.sign({sub:user.id,email:user.email},process.env.JWT_SECRET,{expiresIn:'7d'});
    res.setHeader('Set-Cookie',`residia24_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
    return json(res,200,{user});
  }catch(e){return json(res,500,{error:e.code==='DB_NOT_CONFIGURED'?e.message:'Anmeldung fehlgeschlagen.'});}
};

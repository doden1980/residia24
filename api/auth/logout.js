const {json}=require('../_db');
module.exports=(req,res)=>{if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});res.setHeader('Set-Cookie','residia24_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');return json(res,200,{ok:true});};

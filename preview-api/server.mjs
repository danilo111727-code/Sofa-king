import {createServer} from 'node:http';
import {sign, createPublicKey, verify, randomUUID, timingSafeEqual} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateConfiguration, quote} from './validation.mjs';
import {isAuthorizedAdminResponse} from './authz.mjs';
const PROJECT='lcmtaxesbctibpyggbuj';
const GATEWAY=`https://${PROJECT}.supabase.co/functions/v1/preview-storage`;
const KEY=process.env.PREVIEW_SIGNING_KEY;
if(!KEY) throw new Error('PREVIEW_SIGNING_KEY required');
if(process.env.DATABASE_URL || (process.env.SUPABASE_URL && process.env.SUPABASE_URL!==`https://${PROJECT}.supabase.co`)) throw new Error('Only isolated test project is allowed');
export async function storage(op,collection,id,data){
 const body=JSON.stringify({op,collection,id,data}); const time=String(Date.now());
 const signature=sign('sha256',Buffer.from(time+'\n'+body),KEY).toString('base64');
 const r=await fetch(GATEWAY,{method:'POST',headers:{'content-type':'application/json','x-preview-time':time,'x-preview-signature':signature},body,signal:AbortSignal.timeout(20000)});
 if(!r.ok) throw Object.assign(new Error('Falha ao gravar/ler o banco de testes. Tente novamente.'),{status:503});
 return r.json();
}
const all=c=>storage('list',c);
const get=async(c,id)=>(await storage('get',c,id))[0];
const put=async(c,id,data)=>(await storage('put',c,id,data))[0];
const jwksCache=new Map();
async function identity(req){
 const token=(req.headers.authorization||'').replace(/^Bearer /,'');
 if(process.env.PREVIEW_AUTOMATION_TOKEN && token.length===process.env.PREVIEW_AUTOMATION_TOKEN.length && timingSafeEqual(Buffer.from(token),Buffer.from(process.env.PREVIEW_AUTOMATION_TOKEN))) return {isAdmin:true,signedIn:true,email:'automated-test@invalid.local'};
 try{
  const [head,payload,sig]=token.split('.'); const h=JSON.parse(Buffer.from(head,'base64url')); const p=JSON.parse(Buffer.from(payload,'base64url'));
  const issuer=process.env.CLERK_ISSUER||'https://giving-cowbird-68.clerk.accounts.dev';
  if(h.alg!=='RS256'||p.iss!==issuer||!p.sub||!p.exp||p.exp*1000<Date.now()||(p.nbf&&p.nbf*1000>Date.now()+5000)) throw Error();
  let keys=jwksCache.get(issuer); if(!keys || keys.time<Date.now()-3600000){const r=await fetch(issuer+'/.well-known/jwks.json',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();keys={...(await r.json()),time:Date.now()};jwksCache.set(issuer,keys);}
  const k=keys.keys.find(k=>k.kid===h.kid);if(!k||!verify('RSA-SHA256',Buffer.from(head+'.'+payload),createPublicKey({key:k,format:'jwk'}),Buffer.from(sig,'base64url')))throw Error();
  // Identity-only GET: no catalog, settings or prices are read/written in production.
  // The signed subject must also be an existing Sofa King administrator.
  const r=await fetch('https://sofa-king.onrender.com/api/admin/me',{headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
  const a=await r.json();if(!r.ok||!isAuthorizedAdminResponse(a)) return {signedIn:true,isAdmin:false};
  return {signedIn:true,isAdmin:true,email:a.email};
 }catch{return {signedIn:false,isAdmin:false};}
}
function fail(message,status=400){throw Object.assign(new Error(message),{status});}
function validateProduct(p){
 if(!p.name?.trim())fail('Informe o nome do modelo.');
 if(!Array.isArray(p.sizes)||!p.sizes.length||p.sizes.some(s=>!s.label?.trim()||!Number.isFinite(s.basePrice)||s.basePrice<0))fail('Informe medidas e preços válidos.');
 if(p.priceAdjustmentPercent!==undefined&&(!Number.isFinite(p.priceAdjustmentPercent)||p.priceAdjustmentPercent< -100))fail('Ajuste percentual inválido.');
 if(p.configuration)validateConfiguration(p.configuration);
 const chosen=p.sizes.find(s=>s.label===p.displaySizeLabel);p.price=chosen?.basePrice??Math.min(...p.sizes.map(s=>s.basePrice));
 return p;
}
async function body(req){const chunks=[];let n=0;for await(const c of req){n+=c.length;if(n>12*1024*1024)fail('Arquivo muito grande.',413);chunks.push(c);}return Buffer.concat(chunks);}
const server=createServer(async(req,res)=>{
 res.setHeader('access-control-allow-origin','*');res.setHeader('access-control-allow-headers','content-type,authorization');res.setHeader('access-control-allow-methods','GET,POST,PUT,DELETE,OPTIONS');res.setHeader('cache-control','no-store');res.setHeader('x-sofaking-environment','test');
 const send=(data,status=200)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(data));};
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 try{
 const url=new URL(req.url,'http://localhost');let path=decodeURIComponent(url.pathname);const method=req.method;
 if(method==='HEAD'&&!path.startsWith('/api/')){res.writeHead(200,{'content-type':'text/html'});return res.end();}
 if(method==='GET'&&!path.startsWith('/api/')){
  const asset=/^\/(assets|images|foams)\//.test(path)||path==='/favicon.svg';
  const r=await fetch('https://sofa-king-configurador-preview.onrender.com'+(asset?url.pathname:'/'),{signal:AbortSignal.timeout(20000)});
  res.writeHead(r.status,{'content-type':r.headers.get('content-type')||'text/html'});return res.end(Buffer.from(await r.arrayBuffer()));
 }
 if(path==='/api/healthz')return send({status:'ok',environment:'test',supabaseProject:PROJECT});
 if(path==='/api/readyz'){await all('settings');return send({status:'ok',environment:'test',supabaseProject:PROJECT,persistence:'supabase'});}
 const adminPath=path.startsWith('/api/admin/');
 const needsAdmin=adminPath||(method!=='GET'&&!path.startsWith('/api/events/')&&!path.endsWith('/quote'));
 let auth;
 if(needsAdmin){auth=await identity(req);if(path==='/api/admin/me')return send(auth);if(!auth.isAdmin)fail('Acesso restrito ao administrador',403);}
 if(path==='/api/admin/known-sizes')return send([...new Set((await all('products')).flatMap(p=>p.sizes.map(s=>s.label)))]);
 if(path==='/api/admin/clients')return send({totalCount:0,users:[]});
 if(path==='/api/admin/whatsapp-events')return send((await all('events')).filter(e=>e.type==='whatsapp'));
 if(path==='/api/admin/stats'){
  const ev=await all('events');const views=ev.filter(e=>e.type==='view'),wa=ev.filter(e=>e.type==='whatsapp');
  const recent=(a,d)=>a.filter(e=>e.ts>Date.now()-d*86400000).length;
  const top=a=>Object.values(a.reduce((r,e)=>{if(e.productId){r[e.productId]??={id:e.productId,name:e.productName,count:0};r[e.productId].count++;}return r;},{})).sort((a,b)=>b.count-a.count).slice(0,10);
  return send({totalViews:views.length,totalWhatsapp:wa.length,views7d:recent(views,7),views30d:recent(views,30),whatsapp7d:recent(wa,7),whatsapp30d:recent(wa,30),topViewed:top(views),topWhatsapp:top(wa)});
 }
 if(path==='/api/admin/upload-image'&&method==='POST'){
  const fd=await new Response(await body(req),{headers:{'content-type':req.headers['content-type']}}).formData();const file=fd.get('file');
  if(!file||!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size>8*1024*1024)fail('Envie JPG, PNG, WebP ou GIF até 8 MB.');
  const id=randomUUID();await put('images',id,{id,type:file.type,base64:Buffer.from(await file.arrayBuffer()).toString('base64')});
  return send({url:`${process.env.PUBLIC_URL||'https://sofa-king-configurador-test.onrender.com'}/api/images/${id}`,objectPath:id});
 }
 if(path.startsWith('/api/images/')&&method==='GET'){const im=await get('images',path.split('/').pop());if(!im)fail('Imagem não encontrada',404);res.writeHead(200,{'content-type':im.type,'cache-control':'public,max-age=86400'});return res.end(Buffer.from(im.base64,'base64'));}
 if(path.startsWith('/api/events/')&&method==='POST'){
  const type=path.split('/').pop();if(!['view','whatsapp'].includes(type))fail('Evento inválido');
  const data=JSON.parse((await body(req)).toString()||'{}');const id=randomUUID();await put('events',id,{...data,id,type,ts:Date.now()});return send({success:true});
 }
 const quoteMatch=path.match(/^\/api\/products\/([^/]+)\/quote$/);
 if(quoteMatch&&method==='POST'){
  const p=await get('products',quoteMatch[1]);if(!p)fail('Modelo não encontrado',404);
  const input=JSON.parse((await body(req)).toString());
  return send(quote(p,await all('albums'),await all('materials'),input));
 }
 path=path.replace('/api/admin/','/api/');
 const match=path.match(/^\/api\/(products|albums|materials|settings)(?:\/([^/]+))?$/);if(!match)fail('Rota não encontrada',404);
 const [,collection,rawId]=match;const id=collection==='settings'?'main':rawId;
 if(method==='GET'){
  if(id){const d=await get(collection,id);if(!d)fail('Registro não encontrado',404);return send(d);}
  const data=await all(collection);return send(!adminPath&&['albums','materials'].includes(collection)?data.filter(d=>d.active):data);
 }
 if(method==='DELETE'){if(!id)fail('ID obrigatório');await storage('delete',collection,id);return send({success:true});}
 if(!['POST','PUT'].includes(method))fail('Método inválido',405);
 let data=JSON.parse((await body(req)).toString());const newId=id||randomUUID();
 if(method==='PUT'){const current=await get(collection,newId);if(!current)fail('Registro não encontrado',404);data={...current,...data};}
 if(collection!=='settings')data.id=newId;
 if(collection==='products')data=validateProduct(data);
 if(['albums','materials'].includes(collection)&&!data.name?.trim())fail('Informe o nome.');
 return send(await put(collection,newId,data),method==='POST'?201:200);
 }catch(e){console.error(req.method,req.url,e.message);send({error:e.status?e.message:'Erro no serviço de testes.'},e.status||500);}
});
if(process.env.NODE_ENV!=='test')server.listen(Number(process.env.PORT)||10000,'0.0.0.0',()=>console.log('Isolated Sofa King test API ready'));
export {server};

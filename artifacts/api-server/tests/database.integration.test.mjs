import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {build} from 'esbuild';
import {PGlite} from '@electric-sql/pglite';
import pg from 'pg';
import express from 'express';
import {clerkClient} from '@clerk/express';

// Entirely local Postgres/WASM database. No external database or credentials.
process.env.NODE_ENV='production';
process.env.DATABASE_URL='postgres://local-test-only/sofa_king';
process.env.ADMIN_EMAILS='admin@example.test';
process.env.LOG_LEVEL='silent';
delete process.env.CLERK_SECRET_KEY;
const db=new PGlite();
await db.exec(`CREATE TABLE products(id text PRIMARY KEY,data jsonb,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE materials(id text PRIMARY KEY,data jsonb,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE site_settings(key text PRIMARY KEY,value jsonb,updated_at timestamptz DEFAULT now());`);
const migration=readFileSync(new URL('../scripts/configurator-schema.sql',import.meta.url),'utf8');
await db.exec(migration);
await db.exec(migration); // repeat is safe
const originalQuery=pg.Pool.prototype.query,originalConnect=pg.Pool.prototype.connect;
let failWrites=false;
pg.Pool.prototype.query=async function(sql,params=[]) {
  if(failWrites && /^(INSERT|UPDATE|DELETE)/i.test(sql.trim())) throw new Error('simulated database outage');
  const result=await db.query(sql,params);
  return {...result,rowCount:result.affectedRows ?? result.rows.length};
};
pg.Pool.prototype.connect=async function(){return {query:this.query.bind(this),release(){}};};
const generated=mkdtempSync(fileURLToPath(new URL('./.integration-',import.meta.url)));
await build({entryPoints:[fileURLToPath(new URL('./integration-entry.ts',import.meta.url))],outfile:join(generated,'app.mjs'),
  bundle:true,format:'esm',platform:'node',packages:'external',
  alias:{zod:fileURLToPath(new URL('../../../lib/api-zod/node_modules/zod/index.js',import.meta.url)),'@workspace/api-zod':fileURLToPath(new URL('../../../lib/api-zod/src/index.ts',import.meta.url))},logLevel:'silent'});
const module=await import(join(generated,'app.mjs'));
const product={id:'fixture',name:'Sofá local',price:1000,image:'https://example.test/sofa.png',images:[],sizes:[{label:'2 m',basePrice:1000}],category:'fixo',disponibilidade:true};
await db.query('INSERT INTO products(id,data) VALUES ($1,$2)',['fixture',JSON.stringify(product)]);
await db.query('INSERT INTO materials(id,data) VALUES ($1,$2)',['album',JSON.stringify({id:'album',_type:'album',name:'Tecido',active:true,surcharge:100,fabrics:[]})]);
await db.query('INSERT INTO materials(id,data) VALUES ($1,$2)',['foam',JSON.stringify({id:'foam',_type:'espuma',name:'Espuma',active:true,priceAdjustment:50})]);
await db.query('INSERT INTO site_settings(key,value) VALUES ($1,$2)',['main',JSON.stringify({pixDiscountPct:10,maxInstallments:10,prazoEntregaDias:20})]);
await Promise.all([module.products.initProductStore(),module.initAlbumStore(),module.initMaterialStore(),module.initSettingsStore()]);

// Only this test harness supplies a verified-identity substitute. It is not in src/app.
process.env.CLERK_SECRET_KEY='sk_test_local_fake_never_used_for_network';
const originalUser=clerkClient.users.getUser;
clerkClient.users.getUser=async userId=>({emailAddresses:[{emailAddress:userId==='admin'?'admin@example.test':'customer@example.test',verification:{status:'verified'}}]});
const app=express();app.use(express.json());
app.use((req,_res,next)=>{if(req.headers['x-test-user']) req.auth=()=>({userId:req.headers['x-test-user'],sessionId:'local-session',tokenType:'session_token'});next();});
app.use('/api',module.router);
app.use((err,_req,res,_next)=>res.status(err.status===400?400:503).json({error:err.message}));
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const official=module.officialApp.listen(0,'127.0.0.1');await new Promise(resolve=>official.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}/api`;
const request=async(path,method='GET',body,user='admin')=>fetch(base+path,{method,headers:{'content-type':'application/json',...(user?{'x-test-user':user}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
let albumId;
test('real public/admin routes reject unauthenticated and forged Bearer requests',async()=>{
  const forged='eyJhbGciOiJub25lIn0.'+Buffer.from(JSON.stringify({sub:'admin'})).toString('base64url')+'.';
  for(const path of ['/admin/variation_albums','/admin/debug']) {
    const response=await fetch(`http://127.0.0.1:${official.address().port}/api${path}`,{headers:{authorization:`Bearer ${forged}`}});
    assert.equal(response.status,401);
  }
  assert.equal((await request('/admin/variation_albums','GET',undefined,'customer')).status,403);
});
test('admin variation CRUD persists and public endpoint returns photos and prices',async()=>{
  const response=await request('/admin/variation_albums','POST',{name:'Pés',mode:'single',active:true,options:[{id:'wood',name:'Madeira',imageUrl:'https://example.test/wood.png',priceAdjustment:120}]});
  assert.equal(response.status,201,await response.clone().text());albumId=(await response.json()).id;
  const rows=await db.query('SELECT data FROM sofa_king_private.variation_albums WHERE id=$1',[albumId]);assert.equal(rows.rows[0].data.options[0].priceAdjustment,120);
  const publicRows=await (await request('/variation_albums','GET',undefined,null)).json();assert.equal(publicRows[0].options[0].imageUrl,'https://example.test/wood.png');
});
test('model configuration save/reload preserves price and removed foams',async()=>{
  const configuration={allowedFoamIds:[],catalogVariations:{[albumId]:{enabled:true,optionIds:['wood'],required:true}},delivery:{mode:'days',days:12}};
  const response=await request('/products/fixture','PUT',{configuration});assert.equal(response.status,200,await response.clone().text());
  await module.products.initProductStore(); // simulate cache reload from durable DB
  const saved=await (await request('/products/fixture','GET',undefined,null)).json();
  assert.deepEqual(saved.configuration,configuration);assert.equal(saved.sizes[0].basePrice,1000);assert.equal(saved.price,1000);
});
test('failed durable write returns error and cannot change cache',async()=>{
  failWrites=true;const response=await request('/products/fixture','PUT',{name:'Must not save'});failWrites=false;
  assert.equal(response.status,503);assert.equal(module.products.getById('fixture').name,'Sofá local');
  assert.equal((await db.query("SELECT data->>'name' AS name FROM products WHERE id='fixture'")).rows[0].name,'Sofá local');
});
test('failed creation cannot insert a phantom model in cache',async()=>{
  failWrites=true;
  await assert.rejects(module.products.create({...product,name:'Novo local'}));
  failWrites=false;assert.equal(module.products.getAll().length,1);
});
test('failed deletion preserves the model in cache and database',async()=>{
  failWrites=true;const response=await request('/products/fixture','DELETE');failWrites=false;
  assert.equal(response.status,503);assert(module.products.getById('fixture'));
});
test('concurrent product saves preserve both edits after durable writes',async()=>{
  await Promise.all([module.products.update('fixture',{description:'Primeira alteração'}),module.products.update('fixture',{longDescription:'Segunda alteração'})]);
  const saved=module.products.getById('fixture');assert.equal(saved.description,'Primeira alteração');assert.equal(saved.longDescription,'Segunda alteração');
});
test('existing clients route still returns the provider list',async()=>{
  const originalList=clerkClient.users.getUserList;
  clerkClient.users.getUserList=async()=>({totalCount:1,data:[{id:'client1',emailAddresses:[{emailAddress:'customer@example.test'}],firstName:'Cliente'}]});
  try{const response=await request('/admin/clients');assert.equal(response.status,200);const result=await response.json();assert.equal(result.totalCount,1);assert.equal(result.users[0].id,'client1');}
  finally{clerkClient.users.getUserList=originalList;}
});
test('quote reads current database prices and catches unavailable options',async()=>{
  const input={sizeLabel:'2 m',selections:[{groupId:'catalog:'+albumId,optionId:'wood',quantity:1}]};
  let response=await request('/products/fixture/quote','POST',input,null);assert.equal(response.status,200);assert.equal((await response.json()).total,1120);
  await request('/admin/variation_albums/'+albumId,'PUT',{name:'Pés',active:true,mode:'single',options:[{id:'wood',name:'Madeira',imageUrl:'https://example.test/wood.png',priceAdjustment:170}]});
  response=await request('/cart/quote','POST',{items:[{id:'c',productId:'fixture',qty:2,...input,unitPrice:1}]},null);
  assert.equal(response.status,200);const result=await response.json();assert.equal(result.subtotal,2340);assert.equal(result.items[0].delivery,'Prazo: 12 dias úteis');
  assert.equal((await request('/products/fixture/quote','POST',{...input,foamId:'foam'},null)).status,400);
});
test('invalid association rejected without overwriting product',async()=>{
  const response=await request('/products/fixture','PUT',{configuration:{catalogVariations:{unknown:{enabled:true,optionIds:['missing']}}}});
  assert.equal(response.status,400);assert.equal(module.products.getById('fixture').name,'Sofá local');
});
test('delete variation is durable and blocks its required stale association',async()=>{
  assert.equal((await request('/admin/variation_albums/'+albumId,'DELETE')).status,200);
  assert.equal((await request('/products/fixture/quote','POST',{sizeLabel:'2 m',selections:[]},null)).status,400);
});
test('migration is private and does not touch official product prices',async()=>{
  const result=await db.query("SELECT relrowsecurity FROM pg_class WHERE oid='sofa_king_private.variation_albums'::regclass");assert.equal(result.rows[0].relrowsecurity,true);
  assert.equal((await db.query("SELECT data->'sizes'->0->>'basePrice' AS price FROM products WHERE id='fixture'")).rows[0].price,'1000');
});
after(async()=>{
  failWrites=false;clerkClient.users.getUser=originalUser;pg.Pool.prototype.query=originalQuery;pg.Pool.prototype.connect=originalConnect;
  await Promise.all([new Promise(resolve=>server.close(resolve)),new Promise(resolve=>official.close(resolve))]);
  await db.close();rmSync(generated,{recursive:true,force:true});
});

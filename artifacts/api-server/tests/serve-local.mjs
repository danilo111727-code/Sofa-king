// Isolated manual/visual QA harness. Never imported by the production entry point.

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
for(const key of ['CLERK_SECRET_KEY','GITHUB_TOKEN','GITHUB_FRONTEND_REPO','PRIVATE_OBJECT_DIR']) delete process.env[key];
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

for (let n=2;n<=5;n++) await db.query('INSERT INTO materials(id,data) VALUES ($1,$2)', ['foam'+n,JSON.stringify({id:'foam'+n,_type:'espuma',type:'espuma',name:'Espuma '+n,active:true,priceAdjustment:n*10})]);
await db.exec('CREATE TABLE IF NOT EXISTS events(id text PRIMARY KEY,type text,data jsonb,ts bigint)');
await Promise.all([module.products.initProductStore(),module.initAlbumStore(),module.initMaterialStore(),module.initSettingsStore()]);

// Only this test harness supplies a verified-identity substitute. It is not in src/app.
process.env.CLERK_SECRET_KEY='sk_test_local_fake_never_used_for_network';
const originalUser=clerkClient.users.getUser;
clerkClient.users.getUser=async userId=>({emailAddresses:[{emailAddress:userId==='admin'?'admin@example.test':'customer@example.test',verification:{status:'verified'}}]});
const app=express();app.use(express.json());
app.use((req,_res,next)=>{req.auth=()=>({userId:'admin',sessionId:'local-session',tokenType:'session_token'});next();});
app.use('/api',module.router);
app.use((err,_req,res,_next)=>res.status(err.status===400?400:503).json({error:err.message}));
const server=app.listen(4101,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));

app.use('/uploads',express.static(fileURLToPath(new URL('../sofa-king/dist/public/uploads',import.meta.url))));
app.get('/test-photo.svg',(_req,res)=>res.type('svg').send('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="350"><rect width="500" height="350" fill="#e6e2d6"/><rect x="50" y="140" width="400" height="120" rx="20" fill="#7b8061"/><rect x="35" y="120" width="50" height="150" rx="20" fill="#5c6445"/><rect x="415" y="120" width="50" height="150" rx="20" fill="#5c6445"/></svg>'));
const variations=await module.variations.saveVariation(null,{name:'Braços',active:true,mode:'single',options:[{id:'wide',name:'Braço largo',imageUrl:'http://127.0.0.1:4101/test-photo.svg',priceAdjustment:150},{id:'thin',name:'Braço fino',imageUrl:'http://127.0.0.1:4101/test-photo.svg',priceAdjustment:0}]});
await module.products.update('fixture',{description:'Modelo para validação local',longDescription:'Sofá sob medida',image:'http://127.0.0.1:4101/test-photo.svg',images:['http://127.0.0.1:4101/test-photo.svg'],dimensions:'2 m',colors:[],fabrics:[],configuration:{catalogVariations:{[variations.id]:{enabled:true,optionIds:['wide'],required:true}},delivery:{mode:'days',days:12}}});
console.log('QA LOCAL READY http://127.0.0.1:4101');
process.on('SIGTERM',async()=>{await new Promise(r=>server.close(r));await db.close();rmSync(generated,{recursive:true,force:true});process.exit(0);});

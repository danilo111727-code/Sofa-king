import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {PGlite} from '@electric-sql/pglite';
import {prepareRelease,encodeBackup} from '../src/lib/configurator/releaseBackup.mjs';
const migration=readFileSync(new URL('../scripts/configurator-schema.sql',import.meta.url),'utf8');
async function fixture(){
 const db=new PGlite();
 await db.exec("CREATE TABLE products(id text PRIMARY KEY,data jsonb);CREATE TABLE materials(id text PRIMARY KEY,data jsonb);CREATE TABLE site_settings(key text PRIMARY KEY,value jsonb);CREATE TABLE events(id text PRIMARY KEY,data jsonb)");
 await db.query('INSERT INTO products VALUES ($1,$2)',['model',JSON.stringify({price:1234,sizes:[{label:'2 m',basePrice:1234}]})]);
 await db.query('INSERT INTO site_settings VALUES ($1,$2)',['main',JSON.stringify({pixDiscountPct:10})]);
 return {db,client:{query:(sql,params)=>db.query(sql,params)}};
}
test('release backs up all app rows privately and preserves official model prices',async()=>{
 const {db,client}=await fixture();try{
  const result=await prepareRelease(client,migration);
  assert.equal(result.counts.products,1);
  const backup=(await db.query('SELECT payload,checksum FROM sofa_king_private.release_backups')).rows[0];
  assert.equal(backup.payload.tables.products[0].data.price,1234);
  const encoded=encodeBackup(backup.payload);assert.equal(encoded.checksum,backup.checksum);
  assert.equal(JSON.parse(gunzipSync(encoded.buffer)).tables.products[0].data.price,1234);
  assert.equal((await db.query('SELECT data FROM products')).rows[0].data.price,1234);
  assert.equal((await db.query("SELECT relrowsecurity FROM pg_class WHERE oid='sofa_king_private.release_backups'::regclass")).rows[0].relrowsecurity,true);
  await prepareRelease(client,migration);assert.equal((await db.query('SELECT count(*)::int AS count FROM sofa_king_private.release_backups')).rows[0].count,2);
 }finally{await db.close();}
});
test('backup/migration failure rolls back without changing existing data',async()=>{
 const {db,client}=await fixture();try{
  await assert.rejects(prepareRelease(client,migration+';SELECT * FROM absent_table;'));
  assert.equal((await db.query('SELECT data FROM products')).rows[0].data.price,1234);
  assert.equal((await db.query("SELECT to_regclass('sofa_king_private.release_backups') AS name")).rows[0].name,null);
 }finally{await db.close();}
});

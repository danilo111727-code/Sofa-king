import {createHash,randomUUID} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';

export function encodeBackup(payload) {
  const sort=value=>Array.isArray(value)?value.map(sort):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,sort(value[key])])):value;
  const json=JSON.stringify(sort(JSON.parse(JSON.stringify(payload))));
  return {buffer:gzipSync(json),checksum:createHash('sha256').update(json).digest('hex')};
}

// Runs inside the existing service environment. No credential is read out or logged.
// Only the four existing Sofa King application tables are copied, never other apps.
export async function prepareRelease(client,schemaSql,backupFile) {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
  try {
    await client.query('SELECT pg_advisory_xact_lock(741032901)');
    const tables={};
    for(const table of ['products','materials','site_settings','events']) {
      tables[table]=(await client.query(`SELECT * FROM public.${table}`)).rows;
    }
    if(!tables.products.length || !tables.site_settings.some(row=>row.key==='main')) throw new Error('Catálogo ou configurações indisponíveis. Migração cancelada.');
    const schema=(await client.query("SELECT table_name,column_name,data_type,is_nullable,column_default,udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('products','materials','site_settings','events') ORDER BY table_name,ordinal_position")).rows;
    const indexes=(await client.query("SELECT tablename,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('products','materials','site_settings','events') ORDER BY tablename,indexname")).rows;
    const payload={format:'sofa-king-logical-backup-v1',id:randomUUID(),createdAt:new Date().toISOString(),tables,schema,indexes};
    const encoded=encodeBackup(payload);
    // Private on-disk copy is part of the build artifact; a second durable copy
    // remains in the database even if a later build/start stage fails.
    if(backupFile){mkdirSync(dirname(backupFile),{recursive:true});writeFileSync(backupFile,encoded.buffer,{mode:0o600});}
    for(const statement of schemaSql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean)) {
      if(/^(BEGIN|COMMIT)$/i.test(statement)) continue;
      await client.query(statement);
    }
    await client.query('CREATE TABLE IF NOT EXISTS sofa_king_private.release_backups (id text PRIMARY KEY, payload jsonb NOT NULL, checksum text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())');
    await client.query('ALTER TABLE sofa_king_private.release_backups ENABLE ROW LEVEL SECURITY');
    await client.query('REVOKE ALL ON sofa_king_private.release_backups FROM PUBLIC');
    await client.query('INSERT INTO sofa_king_private.release_backups(id,payload,checksum) VALUES ($1,$2,$3)',[payload.id,JSON.stringify(payload),encoded.checksum]);
    await client.query('COMMIT');
    return {id:payload.id,checksum:encoded.checksum,counts:Object.fromEntries(Object.entries(tables).map(([name,rows])=>[name,rows.length]))};
  } catch(error) {await client.query('ROLLBACK');throw error;}
}

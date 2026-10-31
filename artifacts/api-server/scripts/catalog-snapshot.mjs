import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const arg=name=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const base=(arg('base') || 'https://sofa-king.onrender.com/api').replace(/\/$/,'');
const out=resolve(arg('out') || 'release-evidence/catalog-before.json');
const endpoints=['products','albums','materials','settings'];
const entries=await Promise.all(endpoints.map(async endpoint=>{
  const response=await fetch(`${base}/${endpoint}`,{cache:'no-store',signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw new Error(`${endpoint}: HTTP ${response.status}`);
  return [endpoint,await response.json()];
}));
const data=Object.fromEntries(entries);
if(!Array.isArray(data.products)||!data.products.length)throw new Error('Catálogo vazio ou inválido. Snapshot não salvo.');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const pricing=data=>canonical({products:data.products.map(p=>({id:p.id,price:p.price,sizes:p.sizes,priceAdjustmentPercent:p.priceAdjustmentPercent??0})).sort((a,b)=>a.id.localeCompare(b.id)),
  albums:data.albums.map(a=>({id:a.id,surcharge:a.surcharge,surchargeBySize:a.surchargeBySize??{}})).sort((a,b)=>a.id.localeCompare(b.id)),
  materials:data.materials.map(m=>({id:m.id,priceAdjustment:m.priceAdjustment,priceAdjustmentBySize:m.priceAdjustmentBySize??{}})).sort((a,b)=>a.id.localeCompare(b.id)),
  payment:{pixDiscountPct:data.settings.pixDiscountPct,maxInstallments:data.settings.maxInstallments}});
const hash=data=>createHash('sha256').update(JSON.stringify(pricing(data))).digest('hex');
const snapshot={createdAt:new Date().toISOString(),base,pricingHash:hash(data),data};
mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(snapshot,null,2)+'\n');
console.log(JSON.stringify({out,products:data.products.length,pricingHash:snapshot.pricingHash}));
if(arg('compare')){
  const before=JSON.parse(readFileSync(resolve(arg('compare')),'utf8'));
  if(hash(before.data)!==snapshot.pricingHash)throw new Error('Preços diferem do snapshot anterior. Confira antes de publicar o frontend.');
  console.log('Preços de modelos, tecidos, espumas e condições de pagamento preservados.');
}

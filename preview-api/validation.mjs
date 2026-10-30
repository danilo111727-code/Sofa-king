function invalid(m){throw Object.assign(new Error(m),{status:400});}
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function validateConfiguration(c){
 if(!c||typeof c!=='object'||Array.isArray(c))invalid('Configuração inválida');
 for(const k of ['allowedAlbumIds','allowedFoamIds','allowedFabricIds'])if(c[k]!==undefined&&(!Array.isArray(c[k])||c[k].some(id=>typeof id!=='string')))invalid('Lista de opções inválida');
 if(c.delivery){const d=c.delivery;if(!['days','consult','hidden'].includes(d.mode)||(d.mode==='days'&&(!Number.isInteger(d.days)||d.days<1||d.days>3650)))invalid('Prazo inválido');}
 const ids=new Set();
 if(c.variationGroups!==undefined&&!Array.isArray(c.variationGroups))invalid('Grupos inválidos');
 for(const g of c.variationGroups||[]){
  if(!g.id||ids.has(g.id)||!g.name?.trim()||!['single','quantity'].includes(g.mode)||!g.options?.length)invalid('Preencha o nome e opções de cada grupo');ids.add(g.id);
  const options=new Set();
  for(const o of g.options){if(!o.id||options.has(o.id)||!o.name?.trim()||!finite(o.priceAdjustment))invalid('Opção ou preço inválido');options.add(o.id);
   const min=o.minQuantity??0,max=o.maxQuantity??99;if(!Number.isInteger(min)||!Number.isInteger(max)||min<0||max<min||max>99)invalid('Limites de quantidade inválidos');
  }
 }
 return c;
}
export function quote(p,albums,foams,input){
 const c=p.configuration||{};validateConfiguration(c);
 const size=p.sizes.find(s=>s.label===input.sizeLabel);if(!size)invalid('Medida não permitida');
 const allowed=(id,list)=>list===undefined||list.includes(id);
 const album=input.albumId?albums.find(a=>a.id===input.albumId&&a.active&&allowed(a.id,c.allowedAlbumIds)):null;
 if(input.albumId&&!album)invalid('Álbum não permitido');
 const fabric=input.fabricId?album?.fabrics.find(f=>f.id===input.fabricId&&allowed(f.id,c.allowedFabricIds)):null;
 if(input.fabricId&&!fabric)invalid('Tecido não permitido');
 const foam=input.foamId?foams.find(f=>f.id===input.foamId&&f.active&&allowed(f.id,c.allowedFoamIds)):null;
 if(input.foamId&&!foam)invalid('Espuma não permitida');
 const base=Math.round(size.basePrice*(1+(p.priceAdjustmentPercent||0)/100)*100)/100;
 const albumPrice=album?(size.albumSurcharges?.[album.id]??album.surchargeBySize?.[size.label]??album.surcharge):0;
 const foamPrice=foam?(size.foamSurcharges?.[foam.id]??foam.priceAdjustmentBySize?.[size.label]??foam.priceAdjustment):0;
 let variations=0;const seen=new Set(),singles=new Set();const selection=input.selections||[];
 if(!Array.isArray(selection))invalid('Seleção inválida');
 for(const s of selection){
  const g=c.variationGroups?.find(g=>g.id===s.groupId),o=g?.options.find(o=>o.id===s.optionId);
  if(!g||!o||seen.has(g.id+':'+o.id))invalid('Variação inválida');seen.add(g.id+':'+o.id);
  if(g.mode==='single'){if(singles.has(g.id)||s.quantity!==1)invalid('Escolha uma opção por grupo');singles.add(g.id);}
  if(!Number.isInteger(s.quantity)||s.quantity<(o.minQuantity??0)||s.quantity>(o.maxQuantity??99))invalid('Quantidade inválida');
  variations+=o.priceAdjustment*s.quantity;
 }
 for(const g of c.variationGroups||[])if(g.required&&!selection.some(s=>s.groupId===g.id&&s.quantity>0))invalid(`Selecione ${g.name}`);
 for(const g of c.variationGroups||[])if(g.mode==='quantity')for(const o of g.options)if((o.minQuantity??0)>0&&!selection.some(s=>s.groupId===g.id&&s.optionId===o.id&&s.quantity>=o.minQuantity))invalid(`Informe a quantidade de ${o.name}`);
 const total=Math.round((base+albumPrice+foamPrice+variations)*100)/100;if(!finite(total)||total<0)invalid('Preço final inválido');
 return {basePrice:base,albumSurcharge:albumPrice,foamAdjustment:foamPrice,variationTotal:Math.round(variations*100)/100,total,delivery:c.delivery||null,selections:selection};
}

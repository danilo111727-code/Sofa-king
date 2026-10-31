function invalid(message){throw Object.assign(new Error(message),{status:400});}
export function validateVariationAlbum(album){
 if(!album||typeof album.name!=='string'||!album.name.trim())invalid('Informe o nome da variação.');
 if(!['single','quantity'].includes(album.mode))invalid('Tipo de escolha inválido.');
 if(!Array.isArray(album.options)||!album.options.length)invalid('Adicione pelo menos uma opção.');
 const seen=new Set();
 for(const o of album.options){
  if(!o.id||seen.has(o.id)||typeof o.name!=='string'||!o.name.trim())invalid('Preencha o nome de cada opção.');seen.add(o.id);
  if(typeof o.priceAdjustment!=='number'||!Number.isFinite(o.priceAdjustment)||o.priceAdjustment<0)invalid('Informe um acréscimo válido (zero para incluso).');
  if(!/^(https?:\/\/|\/(?!\/))/.test(o.imageUrl||''))invalid('Adicione uma foto para cada opção.');
  const min=o.minQuantity??0,max=o.maxQuantity??99;
  if(!Number.isInteger(min)||!Number.isInteger(max)||min<0||max<min||max>99)invalid('Limites de quantidade inválidos.');
 }
 return album;
}
export function resolveCatalogVariations(configuration={},albums=[]){
 const associations=configuration.catalogVariations;
 const legacy=configuration.variationGroups||[];
 if(associations===undefined)return legacy;
 const groups=[];
 for(const album of albums){
  const association=associations[album.id];
  if(!album.active||!association?.enabled)continue;
  const options=album.options.filter(o=>o.active!==false&&association.optionIds.includes(o.id));
  if(options.length)groups.push({id:'catalog:'+album.id,name:album.name,mode:album.mode,required:association.required!==false,options});
 }
 return groups;
}

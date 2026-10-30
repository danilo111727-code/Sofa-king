import postgres from "npm:postgres@3.4.7";
const PROJECT = "lcmtaxesbctibpyggbuj";
const PUBLIC_KEY = {"kty":"RSA","n":"2wa-iR3Awl33FRyRM1VkXEDAUBgT_oxFxf64RsmYexh2_H516Yz2yRmuTnhPLcMr6URfXBfUzUg9DAE4EFVUdy3IQIwCE8Hlc8DImSpsghIlQcLABW_iL43ssc0ZdzwBCwQ1qeddgtXk6lQP_L76Sl-q3Gxf4zzGAHkCzAKM-QDqFyD5olAAlw3l9Kfx9Rw6iWOqIyQezD8loM68GRm0CQv7WLLgaZHJoBbNe97dValSbZEBZeDoplgrcck2cp8mi3EGON83mjH7Bmkq90QXOQcBJycPbIOQZ72VgacHd9uYzb9K_xpdkDRLs9edPULD-6qjy6uGUQUXPfLXjDNB_Q","e":"AQAB"};
const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
if (!Deno.env.get("SUPABASE_URL")?.includes(PROJECT)) throw new Error("Test project required");
const sql = postgres(dbUrl, {prepare:false,max:2});
const key = await crypto.subtle.importKey("jwk", PUBLIC_KEY, {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"}, false, ["verify"]);
Deno.serve(async req => {
 try {
  const body = await req.text();
  const time = req.headers.get("x-preview-time") || "";
  const signature = req.headers.get("x-preview-signature") || "";
  if (req.method !== "POST" || Math.abs(Date.now()-Number(time)) > 60000 || !signature) return Response.json({error:"Unauthorized"},{status:401});
  const bytes = Uint8Array.from(atob(signature), c=>c.charCodeAt(0));
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,bytes,new TextEncoder().encode(time+"\n"+body))) return Response.json({error:"Unauthorized"},{status:401});
  const {op,collection,id,data} = JSON.parse(body);
  if (!["products","albums","materials","settings","events","images"].includes(collection)) throw new Error("Invalid collection");
  let result;
  if(op==="list") result = await sql`select data from preview_private.documents where collection=${collection} order by created_at,id`;
  else if(op==="get") result = await sql`select data from preview_private.documents where collection=${collection} and id=${id}`;
  else if(op==="put") {
    if(!id || !data || typeof data!=="object") throw new Error("Invalid document");
    await sql.begin(async tx=>{
      await tx`insert into preview_private.documents(collection,id,data) values(${collection},${id},${tx.json(data)}) on conflict(collection,id) do update set data=excluded.data,updated_at=now()`;
      if(collection==="products") {
        await tx`insert into preview_private.product_drafts(product_id,product_data) values(${id},${tx.json(data)}) on conflict(product_id) do update set product_data=excluded.product_data,updated_at=now()`;
        await tx`insert into preview_private.product_configurations(product_id,configuration) values(${id},${tx.json(data.configuration||{})}) on conflict(product_id) do update set configuration=excluded.configuration,updated_at=now()`;
      }
    });
    result=[{data}];
  } else if(op==="delete") {
    await sql.begin(async tx=>{
      await tx`delete from preview_private.documents where collection=${collection} and id=${id}`;
      if(collection==="products") {
        await tx`delete from preview_private.product_configurations where product_id=${id}`;
        await tx`delete from preview_private.product_drafts where product_id=${id}`;
      }
    }); result=[];
  } else throw new Error("Invalid operation");
  return Response.json(result.map(r=>r.data));
 }catch(e){console.error("preview gateway",String(e));return Response.json({error:"Test persistence unavailable"},{status:503});}
});

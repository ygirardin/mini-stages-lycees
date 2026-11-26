import fs from 'node:fs';
import assert from 'node:assert/strict';
function exportRows(records,today,hasDoc,allowEmpty=false){
 const fields=["lycee","commune","adresse","formation","domaine","type_formation","date_debut","date_fin","horaire","public","places","date_ouverture_inscription","date_limite_inscription","description","metiers","modalites","url_inscription","contact_email","url_lycee","contact_telephone","url_document","date_publication"];
 const ids=new Set(), out=[];let approved=0;
 if(!Array.isArray(records))throw Error("Réponse Grist invalide");
 function date(v){if(v==null||v==="")return "";if(typeof v==="number")v=new Date(v*1000).toISOString().slice(0,10);if(typeof v!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+"T00:00:00Z").toISOString().slice(0,10)!==v)throw Error("Date invalide");return v;}
 function str(v){if(v==null)return "";if(typeof v!=="string")throw Error("Texte attendu");return v.trim();}
 for(const r of records){
  const f=r.fields;if(!f||!("statut" in f))throw Error("Colonne statut inaccessible");
  if(f.statut!=="Publie")continue;approved++;
  try{
   if(r.errors&&Object.keys(r.errors).length)throw Error("Erreur de cellule");
   const s={id:str(f.stage_id)||"grist-"+r.id};
   if(!/^[a-zA-Z0-9_-]+$/.test(s.id)||ids.has(s.id)||s.id.startsWith("demo-"))throw Error("Identifiant invalide");ids.add(s.id);
   for(const k of fields){if(k.startsWith("date_"))s[k]=date(f[k]);else if(k==="places"){const v=f[k];s[k]=v==null||v===""?null:Number(v);if(s[k]!==null&&(!["number","string"].includes(typeof v)||!Number.isInteger(s[k])||s[k]<0))throw Error("Places invalides");}else s[k]=str(f[k]);}
   for(const k of ["lycee","commune","formation","domaine","date_publication"])if(!s[k])throw Error("Champ obligatoire : "+k);
   if(s.date_publication>today||/lyc[eé]e exemple/i.test(s.lycee))throw Error("Publication future ou démonstration");
   if(s.date_fin&&(!s.date_debut||s.date_fin<s.date_debut))throw Error("Dates du stage incohérentes");
   const opening=s.date_ouverture_inscription||s.date_publication;
   const year=Number(opening.slice(0,4))+(opening>opening.slice(0,4)+"-05-01"?1:0);
   if((s.date_limite_inscription||year+"-05-01")<opening)throw Error("Dates des demandes incohérentes");
   for(const k of ["url_inscription","url_lycee"])if(s[k]&&!/^https?:\/\/[^\s/]+/i.test(s[k]))throw Error("URL invalide");
   if(s.contact_email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.contact_email))throw Error("Courriel invalide");
   if(s.url_document&&(!/^documents\/[a-zA-Z0-9_/-]+\.(html|docx)$/.test(s.url_document)||!hasDoc(s.url_document)))throw Error("Document local absent");
   if((s.date_fin||s.date_debut)&&(s.date_fin||s.date_debut)<today)continue;
   out.push(s);
  }catch(e){throw Error("Fiche Grist "+r.id+" : "+e.message);}
 }
 if(!approved&&!allowEmpty)throw Error("Aucune offre publiée : vérifier la table ou autoriser explicitement un catalogue vide");
 return out;
}
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
if(process.argv.includes('--test')){
 const t={id:1,fields:{statut:'Publie',lycee:'Test',commune:'Test',formation:'Test',domaine:'Test',date_publication:'2026-11-16',places:'',secret:'interne'}};
 const rs=exportRows([t,{id:2,fields:{statut:'A_verifier'}}],'2026-11-26',()=>true);
 assert.equal(rs.length,1);assert.equal(rs[0].places,null);assert.ok(!('secret' in rs[0]));
 assert.equal(exportRows([{...t,fields:{...t.fields,places:0}}],'2026-11-26',()=>true)[0].places,0);
 assert.equal(exportRows([{...t,fields:{...t.fields,date_debut:'2026-11-20'}}],'2026-11-26',()=>true).length,0);
 assert.throws(()=>exportRows([{...t,fields:{...t.fields,date_limite_inscription:'2026-11-15'}}],'2026-11-26',()=>true));
 assert.throws(()=>exportRows([],'2026-11-26',()=>true));
 console.log('Tests OK');
}else{
 try{
 const {GRIST_API_BASE,GRIST_DOC_ID,GRIST_API_KEY,GRIST_TABLE='MiniStages',GRIST_ALLOW_EMPTY}=process.env;
 if(!GRIST_API_BASE||!GRIST_DOC_ID||!GRIST_API_KEY)throw Error('Variables Grist manquantes');
 const base=new URL(GRIST_API_BASE);
 if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||!base.pathname.replace(/\/$/,'').endsWith('/api'))throw Error('Base API HTTPS /api requise');
 const endpoint=base.href.replace(/\/$/,'')+'/docs/'+encodeURIComponent(GRIST_DOC_ID)+'/tables/'+encodeURIComponent(GRIST_TABLE)+'/records';
 const response=await fetch(endpoint,{headers:{Authorization:'Bearer '+GRIST_API_KEY,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('HTTP '+response.status);
 const rows=exportRows((await response.json()).records,today,p=>fs.existsSync('public/'+p),GRIST_ALLOW_EMPTY==='1');
 fs.writeFileSync('public/data/mini-stages.json.tmp',JSON.stringify(rows,null,2)+'\n');
 fs.renameSync('public/data/mini-stages.json.tmp','public/data/mini-stages.json');
 console.log('Catalogue généré : '+rows.length+' offre(s).');
 }catch(e){console.error('Synchronisation interrompue : '+e.message);process.exitCode=1;}
}

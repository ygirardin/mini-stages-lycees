import fs from 'node:fs';
fs.rmSync('public',{recursive:true,force:true});fs.mkdirSync('public/data',{recursive:true});
for(const f of ['index.html','app.js','styles.css','theme-vibrant.css'])fs.copyFileSync(f,'public/'+f);
for(const d of ['assets','documents'])if(fs.existsSync(d))fs.cpSync(d,'public/'+d,{recursive:true});
for(const f of ['mini-stages.json','exemples.json','site-config.json'])fs.copyFileSync('data/'+f,'public/data/'+f);
const c=JSON.parse(fs.readFileSync('public/data/site-config.json','utf8'));delete c.email_propositions;fs.writeFileSync('public/data/site-config.json',JSON.stringify(c,null,2)+'\n');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function link(raw){if(!raw)return '';const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password)throw Error('Lien Grist invalide');return esc(u.href);}
const form=link(process.env.GRIST_FORM_URL),admin=link(process.env.GRIST_ADMIN_URL);
function page(title,body){return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="theme-vibrant.css"></head><body><main class="container" style="padding:3rem 1rem;max-width:760px"><a href="./">← Retour au catalogue</a><h1>'+title+'</h1>'+body+'</main></body></html>';}
fs.writeFileSync('public/proposer.html',page('Proposer un mini-stage','<p>Les propositions sont vérifiées avant publication. Ne transmettez aucune donnée nominative d’élève.</p>'+(form?'<p><a class="button button-dark" href="'+form+'" rel="noopener noreferrer">Ouvrir le formulaire Grist</a></p>':'<p>Le formulaire institutionnel est en cours de configuration.</p>')));
fs.writeFileSync('public/admin.html',page('Gestion des offres','<p>Accès réservé aux gestionnaires autorisés dans Grist.</p>'+(admin?'<p><a class="button button-dark" href="'+admin+'">Accéder à Grist</a></p>':'<p>Ouvrez Grist depuis votre espace professionnel.</p>')));

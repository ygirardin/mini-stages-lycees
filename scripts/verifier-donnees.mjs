// Contrôle des fichiers avant publication dans GitHub Pages.
// Exécution : node scripts/verifier-donnees.mjs
import fs from 'node:fs';

function readJson(path) {
  try { return JSON.parse(fs.readFileSync(path, 'utf8')); }
  catch (error) { throw new Error(`${path} : JSON illisible (${error.message})`); }
}
const stages = readJson('data/mini-stages.json');
const config = readJson('data/site-config.json');
const errors = [];
if (!Array.isArray(stages)) errors.push('data/mini-stages.json doit contenir un tableau JSON.');
const ids = new Set();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function isDate(value) {
  if (!datePattern.test(String(value ?? ''))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() + 1 === month && check.getUTCDate() === day;
}
function validUrl(value) {
  if (!value) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
}
if (Array.isArray(stages)) stages.forEach((s, i) => {
  const index = `Fiche ${i + 1}`;
  if (!s || typeof s !== 'object' || Array.isArray(s)) { errors.push(`${index} : objet attendu.`); return; }
  for (const key of ['id', 'lycee', 'commune', 'formation', 'domaine', 'date_debut']) {
    if (!String(s[key] ?? '').trim()) errors.push(`${index} : champ ${key} manquant.`);
  }
  if (ids.has(s.id)) errors.push(`${index} : identifiant en double (${s.id}).`);
  ids.add(s.id);
  if (String(s.id).startsWith('demo-') || /lyc[eé]e exemple/i.test(String(s.lycee))) errors.push(`${index} : donnée de démonstration détectée dans le catalogue réel.`);
  if (!isDate(s.date_debut)) errors.push(`${index} : date_debut invalide (attendu AAAA-MM-JJ).`);
  if (s.date_fin && (!isDate(s.date_fin) || s.date_fin < s.date_debut)) errors.push(`${index} : date_fin invalide ou antérieure à date_debut.`);
  if (s.date_limite_inscription && !isDate(s.date_limite_inscription)) errors.push(`${index} : date_limite_inscription invalide.`);
  if (s.places !== null && s.places !== undefined && s.places !== '' && (!Number.isInteger(s.places) || s.places < 0)) errors.push(`${index} : places doit être null ou un entier positif ou nul.`);
  if (!validUrl(s.url_inscription) || !validUrl(s.url_lycee)) errors.push(`${index} : URL invalide (http ou https uniquement).`);
});
if (!config || typeof config !== 'object' || Array.isArray(config)) errors.push('data/site-config.json doit contenir un objet.');
else if (!String(config.nom_site ?? '').trim() || !String(config.secteur ?? '').trim()) errors.push('La configuration doit contenir nom_site et secteur.');
if (errors.length) { console.error(`⛔ ${errors.length} erreur(s) :\n${errors.map(e => ' - ' + e).join('\n')}`); process.exitCode = 1; }
else console.log(`✅ Données valides : ${stages.length} mini-stage(s).`);

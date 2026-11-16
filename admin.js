/** Éditeur local : le responsable exporte un JSON à publier dans GitHub.
 *  Aucune écriture automatique sur GitHub ou sur un autre serveur. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const fields = ['lycee', 'commune', 'adresse', 'formation', 'domaine', 'type_formation', 'date_debut', 'date_fin', 'horaire', 'public', 'places', 'date_publication', 'date_ouverture_inscription', 'date_limite_inscription', 'description', 'metiers', 'modalites', 'url_inscription', 'contact_email', 'contact_telephone', 'url_lycee', 'url_document'];
  let rows = [], editId = null, changed = false;
  const clean = value => String(value ?? '').trim();
  const element = (tag, cls, content) => { const node = document.createElement(tag); if (cls) node.className = cls; if (content !== undefined) node.textContent = content; return node; };
  const safeUrl = url => { if (!url) return true; try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; } };
  const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T12:00:00`).valueOf());
  function message(where, value, error = false) { const el = $(where); el.textContent = value; el.classList.toggle('error', error); el.hidden = false; }
  function generateId() { return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `stage-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
  function cleanRecord(raw, i = 0) {
    const obj = { id: clean(raw.id) || `stage-import-${i}-${generateId()}` };
    for (const key of fields) obj[key] = key === 'places' ? (raw.places === '' || raw.places == null ? null : Number(raw.places)) : clean(raw[key]);
    return obj;
  }
  function validateList(list) {
    if (!Array.isArray(list)) throw new Error('Le fichier doit contenir une liste JSON [ … ].');
    if (list.length > 5000) throw new Error('Le fichier contient trop de fiches.');
    return list.map((raw, index) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Fiche ${index + 1} invalide.`);
      const r = cleanRecord(raw, index);
      if (!r.lycee || !r.commune || !r.formation || !r.domaine || (r.date_debut && !validDate(r.date_debut))) throw new Error(`Fiche ${index + 1} : lycée, commune ou formation manquant / date invalide.`);
      if (r.date_fin && (!validDate(r.date_fin) || (r.date_debut && r.date_fin < r.date_debut))) throw new Error(`Fiche ${index + 1} : date de fin invalide.`);
      if (r.date_publication && !validDate(r.date_publication)) throw new Error(`Fiche ${index + 1} : date de publication invalide.`);
      if (r.date_ouverture_inscription && !validDate(r.date_ouverture_inscription)) throw new Error(`Fiche ${index + 1} : date d'ouverture des demandes invalide.`);
      if (r.date_limite_inscription && !validDate(r.date_limite_inscription)) throw new Error(`Fiche ${index + 1} : date limite invalide.`);
      if (r.date_ouverture_inscription && r.date_limite_inscription && r.date_ouverture_inscription > r.date_limite_inscription) throw new Error(`Fiche ${index + 1} : la fin de la période des demandes doit être postérieure ou égale à son début.`);
      if (r.places !== null && (!Number.isInteger(r.places) || r.places < 0)) throw new Error(`Fiche ${index + 1} : places invalides.`);
      if (!safeUrl(r.url_inscription) || !safeUrl(r.url_lycee)) throw new Error(`Fiche ${index + 1} : utiliser des liens http(s).`);
      return r;
    });
  }
  function renderRecords() {
    const list = $('recordsList'); list.replaceChildren();
    $('recordCount').textContent = `${rows.length} fiche${rows.length > 1 ? 's' : ''}`;
    if (!rows.length) { list.append(element('p', 'record-empty', 'Aucune offre enregistrée pour le moment. Utilisez le formulaire ci-dessus.')); return; }
    const sorted = [...rows].sort((a, b) => a.date_debut.localeCompare(b.date_debut) || a.lycee.localeCompare(b.lycee, 'fr'));
    for (const r of sorted) {
      const row = element('div', 'record-item'); const info = element('div');
      info.append(element('strong', '', r.formation));
      info.append(element('p', '', `${r.lycee} · ${r.commune} · ${r.date_debut || 'Dates à confirmer'}`));
      const actions = element('div', 'record-buttons');
      const edit = element('button', '', 'Modifier'); edit.type = 'button'; edit.addEventListener('click', () => editRecord(r.id));
      const remove = element('button', 'danger', 'Supprimer'); remove.type = 'button'; remove.addEventListener('click', () => deleteRecord(r.id));
      actions.append(edit, remove); row.append(info, actions); list.append(row);
    }
  }
  function editRecord(id) {
    const r = rows.find(x => x.id === id); if (!r) return;
    for (const field of fields) $(field).value = r[field] === null || r[field] === undefined ? '' : String(r[field]);
    editId = id; $('saveButton').textContent = 'Enregistrer les modifications'; $('cancelEdit').hidden = false;
    $('formTitle').textContent = 'Modifier un mini-stage'; $('formTitle').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('lycee').focus({ preventScroll: true });
  }
  function stopEditing() {
    editId = null; $('stageForm').reset(); $('formTitle').textContent = 'Ajouter un mini-stage'; $('saveButton').textContent = 'Ajouter cette fiche ＋'; $('cancelEdit').hidden = true;
  }
  function deleteRecord(id) {
    if (!confirm('Supprimer cette fiche du fichier en préparation ?')) return;
    rows = rows.filter(r => r.id !== id); if (editId === id) stopEditing(); changed = true; renderRecords(); message('formStatus', 'Fiche supprimée. Pensez à exporter le nouveau JSON.');
  }
  function collectForm() {
    const r = { id: editId || generateId() };
    for (const key of fields) r[key] = key === 'places' ? ($(key).value === '' ? null : Number($(key).value)) : clean($(key).value);
    return validateList([r])[0];
  }
  function parisToday() {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
    const bits = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return bits.year + '-' + bits.month + '-' + bits.day;
  }
  // Les nouvelles offres reçoivent une date de référence lors de leur export.
  // Si leur publication dans GitHub est différée, actualiser cette date dans le JSON.
  function serialized() {
    const now = parisToday();
    const published = rows.map(row => ({ ...row, date_publication: row.date_publication || now }));
    return JSON.stringify(published, null, 2) + '\n';
  }
  function download() {
    const blob = new Blob([serialized()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'mini-stages.json'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000); changed = false; message('exportStatus', 'Fichier téléchargé. Il reste à le publier sur GitHub.');
  }
  async function copy() {
    try { await navigator.clipboard.writeText(serialized()); changed = false; message('exportStatus', 'JSON copié. Collez-le dans data/mini-stages.json sur GitHub.'); }
    catch { message('exportStatus', 'Copie non autorisée dans ce navigateur : utilisez Télécharger le JSON.', true); }
  }
  async function loadPublished() {
    try {
      const result = await fetch('data/mini-stages.json', { cache: 'no-store' });
      if (!result.ok) throw new Error(`HTTP ${result.status}`);
      rows = validateList(await result.json()); changed = false; stopEditing(); renderRecords();
      message('exportStatus', `${rows.length} fiche(s) chargée(s) depuis le site publié.`);
    } catch (error) { console.error(error); rows = []; renderRecords(); message('exportStatus', 'Impossible de charger le fichier publié. Vous pouvez ajouter des fiches ou importer votre fichier JSON.', true); }
  }
  $('stageForm').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const newRecord = collectForm();
      if (editId) rows = rows.map(r => r.id === editId ? newRecord : r); else rows.push(newRecord);
      changed = true; stopEditing(); renderRecords(); message('formStatus', 'Fiche enregistrée dans votre session. Exportez le JSON pour conserver et publier les changements.');
    } catch (error) { message('formStatus', error.message, true); }
  });
  $('cancelEdit').addEventListener('click', stopEditing);
  $('downloadButton').addEventListener('click', download);
  $('copyButton').addEventListener('click', copy);
  $('importFile').addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file) return;
    if (changed && !confirm('Importer ce fichier remplacera les fiches non exportées de cette session. Continuer ?')) { event.target.value = ''; return; }
    try { const incoming = validateList(JSON.parse(await file.text())); rows = incoming; changed = true; stopEditing(); renderRecords(); message('exportStatus', `${rows.length} fiche(s) importée(s). Exportez le fichier pour le publier.`); }
    catch (error) { message('exportStatus', `Import impossible : ${error.message}`, true); }
    event.target.value = '';
  });
  $('reloadButton').addEventListener('click', () => { if (!changed || confirm('Recharger les offres publiées et effacer les modifications non exportées ?')) loadPublished(); });
  window.addEventListener('beforeunload', event => { if (changed) { event.preventDefault(); event.returnValue = ''; } });
  loadPublished();
})();

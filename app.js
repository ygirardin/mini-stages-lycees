/** Catalogue public : données chargées depuis data/mini-stages.json.
 *  Aucune donnée nominative d'élève n'est demandée ou envoyée. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const demoMode = new URLSearchParams(window.location.search).get('demo') === '1';
  const state = { stages: [], failed: false };
  const today = (() => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const v = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${v.year}-${v.month}-${v.day}`;
  })();
  const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
  const defaults = { nom_site: 'Mini-stages des lycées', secteur: 'Votre secteur', annee_scolaire: '2026–2027', organisateur: 'Réseau des établissements du secteur', message_accueil: 'Découvre les formations proposées par les lycées et vis une immersion pour préparer ton orientation.', mention: 'Les dates et modalités sont communiquées par les établissements.' };

  function text(value) { return String(value ?? '').trim(); }
  function normalize(value) { return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR'); }
  function dateObject(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(text(value))) return null; const d = new Date(`${value}T12:00:00`); return Number.isNaN(d.valueOf()) ? null : d; }
  function prettyDate(value) { const d = dateObject(value); return d ? dateFormat.format(d) : 'Dates à confirmer'; }
  function datesText(stage) { const end = text(stage.date_fin); return end && end !== stage.date_debut ? `Du ${prettyDate(stage.date_debut)} au ${prettyDate(end)}` : prettyDate(stage.date_debut); }
  function validUrl(value) { try { const url = new URL(text(value)); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }
  function validEmail(value) { const v = text(value); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : ''; }
  function node(tag, className, content) { const n = document.createElement(tag); if (className) n.className = className; if (content !== undefined) n.textContent = content; return n; }
  function appendTextLine(parent, className, label) { const line = node('div', className); line.textContent = label; parent.append(line); return line; }
  // Dates de demande distinctes de celles du mini-stage.
  // La date de publication est stockée dans la fiche et ne varie pas lors des visites.
  function demandePeriode(stage) {
    const openingKnown = text(stage.date_ouverture_inscription);
    const publication = text(stage.date_publication);
    const opening = openingKnown || (dateObject(publication) ? publication : '');
    const closingKnown = text(stage.date_limite_inscription);
    let closing = closingKnown;
    if (!closing && opening) {
      let year = Number(opening.slice(0, 4));
      if (opening > `${year}-05-01`) year += 1;
      closing = `${year}-05-01`;
    }
    return { opening, closing, openingAuto: !openingKnown && !!opening, closingAuto: !closingKnown && !!closing };
  }
  function demandeDates(stage) {
    const period = demandePeriode(stage);
    if (!period.opening || !period.closing) return 'Période à préciser (date de publication manquante)';
    return `Du ${prettyDate(period.opening)} au ${prettyDate(period.closing)}`;
  }
  function stageStatus(stage) {
    const lastStageDate = text(stage.date_fin || stage.date_debut);
    const { opening, closing } = demandePeriode(stage);
    if (lastStageDate && lastStageDate < today) return { code: 'closed', label: 'Inscription terminée' };
    if (stage.places !== null && stage.places !== undefined && stage.places !== '' && Number(stage.places) === 0) return { code: 'closed', label: 'Inscription terminée (complet)' };
    if (closing && closing < today) return { code: 'closed', label: 'Inscription terminée' };
    if (opening && today < opening) return { code: 'upcoming', label: 'Ouverture à venir' };
    if (opening && closing && opening <= today && today <= closing) return { code: 'open', label: 'Inscription possible' };
    return { code: 'upcoming', label: 'Période à confirmer' };
  }
  function sortStages(a, b) { return text(a.date_debut).localeCompare(text(b.date_debut)) || text(a.lycee).localeCompare(text(b.lycee), 'fr'); }
  function unique(values) { return [...new Set(values.map(text).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })); }
  function populateSelect(id, values, format = x => x) {
    const select = $(id), oldValue = select.value;
    while (select.options.length > 1) select.remove(1);
    for (const value of values) { const option = document.createElement('option'); option.value = value; option.textContent = format(value); select.add(option); }
    select.value = values.includes(oldValue) ? oldValue : '';
  }
  function formatMonth(value) { const [year, month] = value.split('-').map(Number); return monthFormat.format(new Date(year, month - 1, 1)).replace(/^./, c => c.toUpperCase()); }
  function visualForStage(stage) {
    const topic = normalize([stage.domaine, stage.formation, stage.description].join(' '));
    if (/auto|moto|transport|carross|vehicule/.test(topic)) return { icon: '🚗', tone: 'blue' };
    if (/santé|sante|soin|social|medic/.test(topic)) return { icon: '🩺', tone: 'coral' };
    if (/numero|informat|program|digital|code|logiciel/.test(topic)) return { icon: '💻', tone: 'purple' };
    if (/couture|mode|design|textile|art/.test(topic)) return { icon: '🎨', tone: 'coral' };
    if (/menuiser|batiment|métall|metall|thermiq|sanitair|energie|industrie|techniq/.test(topic)) return { icon: '🛠️', tone: 'yellow' };
    if (/commerce|vente|relation client/.test(topic)) return { icon: '🛍️', tone: 'purple' };
    if (/nature|environnement|agricultur|jardin/.test(topic)) return { icon: '🌱', tone: 'mint' };
    if (/restauration|cuisine|hotellerie/.test(topic)) return { icon: '🍳', tone: 'coral' };
    return { icon: '🎓', tone: 'blue' };
  }
  function makeCard(stage) {
    const status = stageStatus(stage);
    const card = node('article', 'stage-card');
    const visual = visualForStage(stage);
    card.classList.add(`card-tone-${visual.tone}`);
    card.append(node('div', 'card-visual', visual.icon));
    const top = node('div', 'card-top');
    const badges = node('div', 'card-badges');
    badges.append(node('span', 'tag', text(stage.domaine) || 'Découverte'));
    badges.append(node('span', `tag status ${status.code}`, status.label));
    top.append(badges);
    top.append(node('div', 'school-line', `${text(stage.lycee)} · ${text(stage.commune)}`));
    const heading = node('h3', '', text(stage.formation) || 'Formation à préciser');
    top.append(heading);
    top.append(node('p', 'card-description', text(stage.description) || 'Découverte de la formation et de l’établissement.'));
    const meta = node('div', 'card-meta');
    appendTextLine(meta, 'meta-line', `◷   ${datesText(stage)}${stage.horaire ? ` · ${text(stage.horaire)}` : ''}`);
    appendTextLine(meta, 'meta-line', `◎   ${text(stage.commune) || 'Lieu à préciser'}`);
    appendTextLine(meta, 'meta-line', `✎   Demandes : ${demandeDates(stage)}`);
    if (stage.places !== null && stage.places !== '' && stage.places !== undefined) appendTextLine(meta, 'meta-line', `◇   ${Number(stage.places)} place(s) indiquée(s)`);
    top.append(meta);
    card.append(top);
    const footer = node('div', 'card-footer');
    footer.append(node('span', 'card-type', text(stage.type_formation) || text(stage.public) || 'Immersion'));
    const button = node('button', 'card-detail', 'Voir la fiche  ↗');
    button.type = 'button';
    button.setAttribute('aria-label', `Voir la fiche de ${text(stage.formation)} au ${text(stage.lycee)}`);
    button.addEventListener('click', () => openDetails(stage));
    footer.append(button); card.append(footer);
    return card;
  }
  function detailInfo(container, label, value) { if (!text(value)) return; const cell = node('div'); cell.append(node('small', '', label), node('strong', '', text(value))); container.append(cell); }
  function actionLink(label, href, className = '') { const link = node('a', className, label); link.href = href; if (href.startsWith('http')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; } return link; }
  function openDetails(stage) {
    const content = $('detailContent'); content.replaceChildren();
    const header = node('div', 'detail-header');
    const close = node('button', 'detail-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Fermer la fiche'); close.addEventListener('click', () => $('detailDialog').close());
    header.append(close, node('span', 'tag', text(stage.domaine) || 'Mini-stage'));
    const title = node('h2', '', text(stage.formation)); title.id = 'detailTitle'; header.append(title);
    header.append(node('p', '', `${text(stage.lycee)} · ${text(stage.commune)}`));
    const body = node('div', 'detail-body');
    const infos = node('div', 'detail-info');
    detailInfo(infos, 'Date', datesText(stage));
    detailInfo(infos, 'Horaires', stage.horaire);
    detailInfo(infos, 'Public', stage.public);
    detailInfo(infos, 'Places annoncées', stage.places === null || stage.places === undefined || stage.places === '' ? '' : `${stage.places} place(s)`);
    detailInfo(infos, 'Période pour déposer une demande', demandeDates(stage));
    const effective = demandePeriode(stage);
    if (effective.openingAuto || effective.closingAuto) detailInfo(infos, 'Dates par défaut', [effective.openingAuto ? 'Ouverture dès la publication' : '', effective.closingAuto ? 'Clôture automatique au 1er mai' : ''].filter(Boolean).join(' · '));
    detailInfo(infos, 'Adresse', stage.adresse);
    body.append(infos);
    for (const [heading, value] of [['À propos de ce mini-stage', stage.description], ['Métiers à découvrir', stage.metiers], ['Modalités pratiques', stage.modalites]]) {
      if (!text(value)) continue; const block = node('section', 'detail-block'); block.append(node('h3', '', heading), node('p', '', text(value))); body.append(block);
    }
    const inscription = node('section','detail-block'); inscription.append(node('h3','','Comment se déroule la demande ?'), node('p','',`1. Pendant la période de demandes annoncée, prenez contact avec le secrétariat de votre établissement scolaire (collège ou lycée) pour qu’il effectue l’inscription. 2. L’établissement proposant le mini-stage revient ensuite vers l’établissement qui a inscrit l’élève et lui transmet une convention. 3. Le secrétariat vous accompagne pour les formalités à accomplir avant l’immersion.`)); body.append(inscription);
    const links = node('div', 'detail-links'); const registrationUrl = validUrl(stage.url_inscription), schoolUrl = validUrl(stage.url_lycee), email = validEmail(stage.contact_email);
    if (!demoMode && registrationUrl) links.append(actionLink('Consulter l’inscription  ↗', registrationUrl, 'button button-dark'));
    if (!demoMode && schoolUrl) links.append(actionLink('Site du lycée ↗', schoolUrl));
    if (!demoMode && /^documents\/[\w./-]+\.(?:html|docx)$/.test(text(stage.url_document))) links.append(actionLink(text(stage.url_document).endsWith('.docx') ? 'Télécharger le formulaire de demande ↗' : 'Consulter la fiche source ↗', stage.url_document));
    if (!demoMode && email) links.append(actionLink('Contacter le lycée ↗', `mailto:${email}`));
    if (links.childElementCount) body.append(links);
    body.append(node('p', 'detail-fineprint', demoMode ? 'Ceci est une fiche fictive de démonstration. Aucune inscription possible.' : 'Le site ne recueille aucune demande d’inscription. Dates et places à confirmer auprès des établissements.'));
    content.append(header, body); $('detailDialog').showModal();
  }
  function activeFilters() { return !!($('searchInput').value || $('domainFilter').value || $('cityFilter').value || $('monthFilter').value || $('statusFilter').value !== 'all'); }
  function resetFilters() { $('searchInput').value = ''; $('domainFilter').value = ''; $('cityFilter').value = ''; $('monthFilter').value = ''; $('statusFilter').value = 'all'; render(); $('searchInput').focus(); }
  function filteredStages() {
    const q = normalize($('searchInput').value), domain = $('domainFilter').value, city = $('cityFilter').value, month = $('monthFilter').value, statusFilter = $('statusFilter').value;
    return state.stages.filter(s => {
      const status = stageStatus(s);
      if (q && !normalize([s.lycee, s.commune, s.formation, s.domaine, s.type_formation, s.description, s.metiers, s.public].join(' ')).includes(q)) return false;
      if (domain && text(s.domaine) !== domain) return false;
      if (city && text(s.commune) !== city) return false;
      if (month && !text(s.date_debut).startsWith(month)) return false;
      if (statusFilter === 'upcoming' && !['upcoming', 'open'].includes(status.code)) return false;
      if (statusFilter === 'open' && status.code !== 'open') return false;
      return true;
    });
  }
  function render() {
    const cards = $('cardsGrid'), stages = filteredStages(), filtersUsed = activeFilters();
    cards.replaceChildren(...stages.map(makeCard)); cards.setAttribute('aria-busy', 'false');
    $('totalCount').textContent = String(state.stages.length);
    $('resultsLabel').textContent = `${stages.length} résultat${stages.length > 1 ? 's' : ''}${filtersUsed ? ' avec ces filtres' : ''}`;
    $('clearFilters').hidden = !filtersUsed;
    $('emptyState').hidden = stages.length !== 0;
    $('emptyReset').hidden = !filtersUsed;
    $('demoLink').hidden = demoMode || filtersUsed || state.failed;
    if (!stages.length) {
      $('emptyHeading').textContent = state.failed ? 'Impossible de charger les offres' : filtersUsed ? 'Aucun résultat pour ces filtres' : demoMode ? 'Aucune donnée de démonstration' : 'Les premiers mini-stages arrivent bientôt';
      $('emptyText').textContent = state.failed ? 'Le fichier de données est indisponible. Contactez la personne qui gère le site ou réessayez ultérieurement.' : filtersUsed ? 'Essaie de modifier le domaine, la commune, la période ou le mot-clé.' : demoMode ? 'Le fichier d’exemple est indisponible.' : 'Aucune offre n’a encore été publiée. Les propositions des lycées apparaîtront ici dès leur mise en ligne.';
    }
  }
  function applyConfig(config) {
    const c = { ...defaults, ...config };
    $('schoolYear').textContent = `ANNÉE SCOLAIRE ${text(c.annee_scolaire)}`;
    $('sectorName').textContent = text(c.secteur).toLowerCase();
    $('heroIntro').textContent = text(c.message_accueil);
    $('footerOrg').textContent = text(c.organisateur);
    $('footerNotice').textContent = text(c.mention);
    document.title = `${text(c.nom_site)} — Explorer, découvrir, choisir`;
    const email = validEmail(c.email_contact);
    if (email) { $('contactLink').href = `mailto:${email}`; $('contactLink').hidden = false; }
  }
  async function fetchJson(path) { const r = await fetch(path, { cache: 'no-store' }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
  async function init() {
    if (demoMode) $('demoBanner').hidden = false;
    try { applyConfig(await fetchJson('data/site-config.json')); } catch { applyConfig(defaults); }
    try {
      const rows = await fetchJson(demoMode ? 'data/exemples.json' : 'data/mini-stages.json');
      if (!Array.isArray(rows)) throw new Error('Les données doivent contenir une liste JSON.');
      state.stages = rows.filter(s => s && typeof s === 'object' && text(s.lycee) && text(s.formation) && (!text(s.date_debut) || dateObject(s.date_debut))).sort(sortStages);
    } catch (error) { console.error('Chargement des offres', error); state.failed = true; }
    populateSelect('domainFilter', unique(state.stages.map(s => s.domaine)));
    populateSelect('cityFilter', unique(state.stages.map(s => s.commune)));
    populateSelect('monthFilter', unique(state.stages.map(s => text(s.date_debut).slice(0, 7))), formatMonth);
    render();
  }
  ['searchInput', 'domainFilter', 'cityFilter', 'monthFilter', 'statusFilter'].forEach(id => $(id).addEventListener(id === 'searchInput' ? 'input' : 'change', render));
  $('clearFilters').addEventListener('click', resetFilters);
  $('emptyReset').addEventListener('click', resetFilters);
  $('detailDialog').addEventListener('click', event => { if (event.target === $('detailDialog')) $('detailDialog').close(); });
  init();
})();

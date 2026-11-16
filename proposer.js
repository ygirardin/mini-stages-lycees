/* Formulaire public de proposition, sans authentification GitHub.
   Réception via FormSubmit seulement après configuration de l'e-mail professionnel. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const form = $('proposalForm');
  const submitButton = $('submitProposal');
  let recipient = '';

  function say(message, error = false) {
    const status = $('formStatus');
    status.textContent = message;
    status.hidden = false;
    status.className = error ? 'error' : 'success';
  }

  function emailValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function formatFields() {
    const labels = [
      ['lycee', "Lycée d'accueil"], ['commune', 'Commune'], ['adresse', 'Adresse'],
      ['formation', 'Formation'], ['domaine', 'Domaine'], ['public', 'Public'],
      ['date_ouverture_inscription', 'Ouverture des demandes'],
      ['date_limite_inscription', 'Clôture des demandes'],
      ['date_debut', 'Date du mini-stage'], ['date_fin', 'Fin du mini-stage'],
      ['horaire', 'Horaires / durée'], ['places', 'Places'], ['description', 'Programme'],
      ['modalites', 'Modalités'], ['contact_email', 'E-mail du lycée'],
      ['contact_telephone', 'Téléphone du lycée'], ['url_lycee', 'Site du lycée']
    ];
    const lines = [
      'PROPOSITION DE MINI-STAGE — À VÉRIFIER AVANT PUBLICATION',
      '-----------------------------------',
      'Dates de demande : ouverture à la publication si non renseignée,',
      'clôture au 1er mai suivant si non renseignée.',
      ''
    ];
    for (const [id, label] of labels) {
      const val = $(id).value.trim();
      lines.push(label + ' : ' + (val || '(non communiqué)'));
    }
    lines.push('', 'La demande des élèves passe par le secrétariat de leur établissement.',
      "L'établissement d'accueil transmet ensuite une convention à cet établissement.");
    return lines.join('\n');
  }

  function validateDates() {
    const opening = $('date_ouverture_inscription').value;
    const closing = $('date_limite_inscription').value;
    const stageStart = $('date_debut').value;
    const stageEnd = $('date_fin').value;
    if (opening && closing && opening > closing) {
      say('La clôture des demandes doit être postérieure ou égale à leur ouverture.', true);
      $('date_limite_inscription').focus();
      return false;
    }
    if (stageStart && stageEnd && stageStart > stageEnd) {
      say('La date de fin du mini-stage ne peut pas précéder son début.', true);
      $('date_fin').focus();
      return false;
    }
    return true;
  }

  $('downloadProposal').addEventListener('click', () => {
    if (!form.reportValidity() || !validateDates()) return;
    const blob = new Blob([formatFields()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'proposition-mini-stage.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say("Votre proposition est téléchargée. Elle n'a pas été envoyée au responsable.");
  });
  $('copyProposal').addEventListener('click', async () => {
    if (!form.reportValidity() || !validateDates()) return;
    try {
      await navigator.clipboard.writeText(formatFields());
      say("Proposition copiée. Elle n'a pas été envoyée au responsable.");
    } catch (_) {
      say("La copie automatique n'est pas autorisée. Utilisez Télécharger ma proposition.", true);
    }
  });

  form.addEventListener('submit', (event) => {
    if (!validateDates()) {
      event.preventDefault();
      return;
    }
    if (!recipient) {
      event.preventDefault();
      say("L'envoi est indisponible tant qu'aucune adresse de réception n'est configurée. Téléchargez votre proposition.", true);
      return;
    }
    // L'envoi déclenche une navigation vers le service tiers.
    // Une confirmation d'activation peut être requise par le destinataire.
  });

  async function init() {
    $('nextUrl').value = new URL('proposition-envoyee.html', location.href).href;
    $('sourceUrl').value = location.href;
    try {
      const response = await fetch('data/site-config.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Configuration indisponible');
      const settings = await response.json();
      const email = String(settings.email_propositions || '').trim();
      if (emailValid(email)) {
        recipient = email;
        form.action = 'https://formsubmit.co/' + encodeURIComponent(email);
        submitButton.disabled = false;
        $('configurationNotice').hidden = true;
        return;
      }
    } catch (error) {
      console.warn('Réception des propositions non configurée', error);
    }
    $('configurationNotice').hidden = false;
    submitButton.disabled = true;
  }
  init();
})();

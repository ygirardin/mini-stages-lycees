# Migration expérimentale — Orientation / Forge / Grist

Ne pas fusionner cette branche dans main sur GitHub. Le site historique doit rester en service. Importer le dépôt sur la Forge, puis fusionner la branche de migration **sur la Forge uniquement** dans sa branche par défaut. Si l'import ne reprend que main, importer aussi la branche migration-forge-grist avec Git. Avant publication, vérifier les droits sur les images et documents d'établissements et choisir une licence libre pour le code (LICENSE). Ne pas appliquer cette licence aux documents tiers sans autorisation.

## 1. Site expérimental

- Se connecter à https://forge.apps.education.fr/ avec son compte professionnel.
- Créer un projet via Importer un projet / dépôt par URL si disponible, URL source : https://github.com/ygirardin/mini-stages-lycees.git.
- Dans le projet Forge, vérifier la présence de migration-forge-grist, puis fusionner vers la branche par défaut de ce nouveau projet. Ne pas activer de miroir qui écraserait ces modifications.
- Vérifier le pipeline dans Compilation / Pipelines et les runners disponibles. Le fichier .gitlab-ci.yml utilise une image Node 22 ; adapter le runner si nécessaire.
- Le premier déploiement utilise les 4 fiches historiques (GRIST_ENABLED absent ou 0). Consulter Déploiement / Pages ; vérifier l'accès public sans connexion, les fiches et l'impression. Le formulaire externe FormSubmit n'est pas déployé sur la Forge. Le site GitHub reste inchangé.

## 2. Grist

Depuis https://portail.apps.education.fr/, ouvrir Grist. Créer un document privé Orientation – Mini-stages. Importer migration/grist/MiniStages.csv en tant que nouvelle table dont l'identifiant technique est exactement MiniStages (voir Données brutes). Les quatre lignes sont les offres existantes et conservent leur date de publication et leur identifiant d'origine.
Créer la table Propositions à partir de migration/grist/Propositions.csv (fichier d'en-têtes uniquement ; si Grist refuse, créer les colonnes manuellement). Ne jamais l'utiliser comme source du catalogue.

Types de colonnes : conserver les identifiants techniques des en-têtes. Dans MiniStages, utiliser Texte pour stage_id et tous les champs non datés, y compris places et contact_telephone. places vide = capacité inconnue, "0" = complet. Les dates peuvent être de type Date ou Texte ISO AAAA-MM-JJ. Contrôler que l'import n'a pas transformé les téléphones, les dates ou les identifiants. statut : Choix (A_verifier, Publie, Archive, Refuse), vide ou A_verifier par défaut pour toute nouvelle ligne. Ne pas renommer les identifiants de colonnes. Ne pas mettre de données nominatives d'élève dans aucune table.

Partager le document uniquement avec les gestionnaires autorisés. Créer une vue Formulaire sur Propositions et choisir les champs utiles. Exclure suivi_interne. Rendre lycée, commune, formation, domaine et email_proposant obligatoires ; laisser les dates facultatives. places_annoncees en texte : vide = inconnu. Distinguer email_proposant (privé, pour recontacter le déclarant) et contact_email (adresse professionnelle destinée à être publiée). Ajouter une information de traitement des données et interdire les données élèves. Publier uniquement le formulaire natif, si l'instance le permet, sans partager le document lui-même. Tester en navigation privée : envoi d'une proposition, impossibilité d'afficher les autres réponses, impossibilité d'accéder à MiniStages. Si l'anonymat n'est pas autorisé, garder un formulaire réservé aux personnels authentifiés ou une réception institutionnelle ; ne pas ouvrir le document au public.

### Validation quotidienne

1. Relire une proposition, confirmer les informations avec le lycée.
2. Copier seulement les champs publiables dans MiniStages (places_annoncees vers places), jamais email_proposant ou suivi_interne. Vérifier les liens, les dates et les documents. Les pièces locales historiques restent dans documents/ ; un nouveau document doit être ajouté sur la Forge après contrôle ou être lié via une URL publique autorisée dans url_inscription.
3. Renseigner date_publication le jour prévu de première mise en ligne, puis statut = Publie. Le script exige cette date, ne la change jamais et refuse une date future. Si le déploiement échoue ou est différé au lendemain, corriger la date avant la première mise en ligne effective. Les dates explicites d'ouverture et de clôture priment ; sinon ouverture = publication, clôture = 1er mai suivant l'ouverture (inclus).
4. Corriger une offre en conservant sa date_publication. Laisser stage_id vide pour les nouvelles offres : le script génère grist-ID. Ne pas réutiliser ou modifier les IDs existants.
5. Une offre dont la date de fin (ou début à défaut) est passée est masquée par l'export ; la ligne reste dans Grist. Pour les offres sans date de séance, l'archivage reste manuel via statut Archive. La date limite de demande ferme les inscriptions mais ne supprime pas l'offre.

## 3. Liaison sécurisée

Dans Forge : Paramètres / CI/CD / Variables. Créer les variables ci-dessous au niveau projet, jamais dans un fichier ou dans une discussion. GRIST_API_KEY : masquée (et cachée si disponible), protégée ; vérifier que la branche par défaut est protégée. Une clé Grist peut donner accès à tous les documents de son titulaire : utiliser si possible une identité dédiée avec accès lecteur uniquement au document. Vérifier que la Forge peut atteindre l'API Grist.

| Variable | Valeur |
| --- | --- |
| GRIST_API_BASE | URL HTTPS de l'API de l'instance Grist, se terminant par /api (vérifier dans l'aide de l'instance) |
| GRIST_DOC_ID | Identifiant du document Grist, dans les paramètres du document |
| GRIST_API_KEY | Clé API obtenue dans le profil Grist ; ne jamais la communiquer |
| GRIST_TABLE | MiniStages (facultatif) |
| GRIST_FORM_URL | URL du formulaire publié (facultative, mais nécessaire pour proposer un stage) |
| GRIST_ADMIN_URL | URL du document privé (facultative ; visible dans la page publique, sans aucun secret) |
| GRIST_ENABLED | 1 uniquement après configuration et contrôle ; 0 pour le premier déploiement |
| GRIST_ALLOW_EMPTY | 1 seulement si le catalogue vide est intentionnel ; sinon absent |

Lancer manuellement le pipeline, vérifier le succès et le catalogue : les quatre fiches initiales doivent être reprises avec les dates conservées, puis tester une proposition et sa validation. Vérifier en particulier une capacité vide, un zéro et une date par défaut. Le pipeline lit uniquement MiniStages, exporte les lignes Publie et une liste explicite de champs ; les données de propositions ne sont pas lues. Aucun secret n'est publié. Si une ligne publiée est invalide, si l'API échoue, ou si aucune ligne n'est validée sans autorisation explicite, le pipeline échoue avant publication. Une fois activé, ne pas désactiver GRIST_ENABLED pour contourner une erreur : cela republierait l'instantané initial.

Créer une planification Compilation / Planifications de pipeline sur la branche par défaut : par exemple 0 * * * * (toutes les heures), puis */15 * * * * si les quotas et limites Forge le permettent. La planification n'est pas créée automatiquement par le YAML. Surveiller les premiers déploiements et vérifier que le dernier site valide reste disponible en cas d'échec. La mise à jour n'est pas instantanée.

## 4. Recette avant bascule

- Accès public sans authentification au site Pages.
- Charte, liens sources (dont DOCX), impression, recherche et filtres inchangés.
- Proposition anonyme ou authentifiée selon possibilités ; pas de données des autres contributeurs accessibles.
- Une offre en attente n'apparaît jamais ; offre validée apparaît après pipeline ; correction et archivage se répercutent.
- Date de publication stable, fermeture au 1er mai, 0 place = complet, vide = inconnu, mention sous réserve de places.
- Test de panne Grist : aucun nouvel artefact public ne doit être déployé.
- Contrôle licence, autorisations des documents, droit d'accès, suivi et information des contributeurs.
- Seulement après validation : redirection de GitHub vers l'URL Forge confirmée.

Documentation : https://docs.forge.apps.education.fr/ ; https://support.getgrist.com/widget-form/ ; https://support.getgrist.com/api/ ; https://docs.gitlab.com/ci/pipelines/schedules/

Les scripts contiennent des tests unitaires intégrés au pipeline. Les accès réels, la syntaxe CI sur l'instance et la recette navigateur restent à vérifier sur la Forge. Notifications courriel et transfert automatique des pièces jointes ne sont pas inclus dans cette version initiale.

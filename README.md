# Mini-stages des lycées — site prêt pour GitHub Pages

Site statique en français, accessible sur ordinateur et sur téléphone, pour publier et rechercher les mini-stages proposés par les lycées d'un secteur. Aucune installation de serveur, aucun compte élève et aucune base de données nécessaires.

## 1. Publier gratuitement sur GitHub Pages

1. Connectez-vous à [GitHub](https://github.com) puis créez un dépôt **public** appelé par exemple `mini-stages-lycees` (bouton **New repository**).
2. Décompressez l'archive livrée. Dans le dépôt, choisissez **Add file > Upload files**, puis importez **les fichiers et dossiers de l'archive** (pas l'archive `.zip` elle-même) à la racine du dépôt. Conservez les dossiers `assets/` et `data/`. Vous devez avoir `index.html` à la racine.
3. Validez l'ajout des fichiers avec **Commit changes**, sur la branche `main`.
4. Ouvrez **Settings > Pages**. Sous **Build and deployment**, sélectionnez **Deploy from a branch**, puis **main** et **/(root)**, enfin **Save**.
5. Le site aura une adresse de la forme `https://VOTRE-PSEUDO.github.io/mini-stages-lycees/`. GitHub affiche le lien exact dans **Settings > Pages** quand le site est prêt.

Documentation officielle : https://docs.github.com/fr/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

> Le dépôt et les données sont publics. Ne publiez **aucune donnée personnelle d'élève**, aucun document confidentiel et aucune information de connexion. Selon l'offre GitHub, Pages peut aussi rendre accessible le contenu d'un dépôt privé.

## 2. Personnaliser le secteur

Éditez `data/site-config.json` directement sur GitHub (icône crayon), puis validez la modification.

```json
{
  "nom_site": "Mini-stages des lycées du Bassin Exemple",
  "secteur": "le Bassin Exemple",
  "annee_scolaire": "2026–2027",
  "organisateur": "Établissements du Bassin Exemple",
  "email_contact": "orientation@exemple.fr",
  "message_accueil": "Découvre les formations proposées par les lycées près de chez toi.",
  "mention": "Vérifiez les modalités auprès de chaque établissement."
}
```

Remplacez toutes les valeurs d'exemple par les vôtres. L'adresse `email_contact` est facultative ; si elle est vide, aucun lien de contact général n'est affiché. Les noms d'établissements et les offres ne sont **pas remplis automatiquement**.

## 3. Ajouter, modifier ou supprimer des mini-stages

### Méthode simple — formulaire sur le site

1. Ouvrez `https://VOTRE-PSEUDO.github.io/mini-stages-lycees/admin.html`.
2. Le formulaire charge les fiches actuellement publiées depuis `data/mini-stages.json`.
3. Remplissez une fiche par séance de mini-stage. Vous pouvez modifier ou supprimer des fiches.
4. Cliquez sur **Télécharger le JSON** ou **Copier le JSON**.
5. Dans GitHub, ouvrez `data/mini-stages.json`, puis l'icône **crayon** (Edit this file). **Remplacez tout le contenu** par le texte exporté ou copié. Vous pouvez aussi déposer le fichier téléchargé en remplacement dans le dossier `data/`.
6. Cliquez sur **Commit changes**. GitHub Pages republie ensuite le catalogue.

⚠️ Le formulaire `admin.html` **n'est pas un système d'administration avec connexion**. Il ne publie jamais automatiquement. Chacun peut le consulter, mais **seules les personnes disposant des droits sur le dépôt GitHub** peuvent modifier les données publiées. Les modifications faites dans le formulaire restent dans l'onglet jusqu'à l'export ; elles disparaissent en cas de fermeture ou de rechargement sans sauvegarde.

### Méthode avancée — modifier le fichier JSON

Le fichier `data/mini-stages.json` contient un tableau de fiches. Exemple de format (fictif, à ne pas publier tel quel) :

```json
[
  {
    "id": "lycee-a-2027-01-19-commerce",
    "lycee": "NOM RÉEL DU LYCÉE",
    "commune": "COMMUNE",
    "adresse": "Adresse du lycée",
    "formation": "Bac pro Métiers du commerce et de la vente",
    "domaine": "Commerce et vente",
    "type_formation": "Bac pro",
    "date_debut": "2027-01-19",
    "date_fin": "",
    "horaire": "9h00 – 12h00",
    "public": "Élèves de 3e",
    "places": 12,
    "date_publication": "2026-11-16",
    "date_ouverture_inscription": "2027-01-05",
    "date_limite_inscription": "2027-01-12",
    "description": "Visite des ateliers et activités proposées.",
    "modalites": "L’établissement scolaire réalise la demande, puis le lycée d’accueil lui transmet la convention.",
    "url_inscription": "https://exemple.fr/inscription",
    "contact_email": "contact@exemple.fr",
    "url_lycee": "https://exemple.fr"
  }
]
```

**Champs indispensables :** `lycee`, `commune`, `formation`, `domaine`. La date du mini-stage (`date_debut`) peut rester vide si elle est inconnue. `date_ouverture_inscription` correspond à l'ouverture de la période de dépôt des demandes, et `date_limite_inscription` à sa clôture. Les dates sont au format `AAAA-MM-JJ` et peuvent rester vides si elles n'ont pas été annoncées. Les autres champs sont facultatifs. Pour `places`, laissez `null` si la capacité est inconnue ; `0` signale « complet » ; un entier positif indique des places annoncées, **sans garantie en temps réel**. `date_fin` sert aux mini-stages sur plusieurs jours. Une fiche = une session ou une plage de dates.

Les résultats sont automatiquement triés par date. Les filtres permettent de chercher par mots-clés, domaine, commune, période et statut. Le feu vert s'affiche lorsque la période effective (dates annoncées ou calculées par défaut) est en cours. Le feu rouge indique une clôture, une session passée ou des places épuisées. Les informations incomplètes sont indiquées en gris.

## 4. Mode démonstration (séparé des vraies offres)

Le catalogue réel lit **uniquement** `data/mini-stages.json`, qui contient désormais les offres du GARAC et du lycée Ferdinand Buisson.

Pour tester le site avec cinq fiches **entièrement fictives**, ajoutez `?demo=1` à l'adresse du site :

`https://VOTRE-PSEUDO.github.io/mini-stages-lycees/?demo=1`

Le bandeau indique clairement qu'il s'agit de démonstrations ; ces données ne sont pas publiées dans le catalogue normal. Le fichier `data/exemples.json` ne doit pas servir de liste officielle.

## 5. Vérifier le site en local

Le chargement des fichiers JSON nécessite un serveur HTTP (ouvrir directement `index.html` avec `file://` ne suffit pas dans certains navigateurs). Si Python est installé :

```bash
cd site-mini-stages
python -m http.server 8000
```

Puis visitez `http://localhost:8000/` et `http://localhost:8000/?demo=1`.

## 6. Bonnes pratiques pour les collèges et lycées

- Désignez un responsable du dépôt et une personne chargée de vérifier les fiches avant chaque publication.
- Confirmez les dates, horaires, modalités, capacité et éventuels prérequis avec les lycées avant de les ajouter.
- Pour les demandes d'inscription, utilisez les plateformes institutionnelles ou les coordonnées professionnelles des établissements ; ce site **ne collecte aucune donnée d'élève**.
- Ne publiez pas d'adresses e-mail personnelles ni d'informations permettant d'identifier des mineurs.
- Supprimez les anciennes offres ou conservez-les comme historique visible. Utilisez le filtre « À venir » pour n'afficher que les dates futures.

## Arborescence

```text
index.html                 Catalogue public
admin.html                 Gestion locale des fiches
styles.css                 Mise en page responsive
app.js                     Recherche, filtres, fiches
admin.js                   Formulaire et export JSON
assets/favicon.svg         Icône du site
data/mini-stages.json      Offres réelles (vide au départ)
data/exemples.json         Données fictives pour démonstration
data/site-config.json      Nom du site, secteur et texte d'accueil
README.md                  Ce guide
.nojekyll                  Indique que le site est statique
```

## Limites techniques

Ce projet est **statique** : pas de formulaire d'inscription élève, pas de statistiques de fréquentation, pas de disponibilité en temps réel, pas d'authentification propre à la page d'édition. GitHub Pages publie les fichiers présents dans le dépôt. Pour une saisie multi-établissements avec validation automatique, il faudra ajouter ultérieurement un service dédié (p. ex. formulaire connecté à un outil de stockage sécurisé et un circuit de relecture).

Licence recommandée : code librement réutilisable pour un usage éducatif ; vérifier et choisir une licence adaptée avant diffusion du code.

## 7. Contrôle automatique des fichiers

Le dépôt contient le contrôle `scripts/verifier-donnees.mjs` et le workflow `.github/workflows/verifier-donnees.yml`. À chaque modification de la branche `main`, GitHub Actions vérifie que les JSON sont valides, que les dates et les liens ont un format correct, et que les offres fictives de démonstration ne sont pas copiées dans le catalogue réel. Les résultats sont visibles dans l'onglet **Actions** du dépôt.

Pour lancer le contrôle en local, installez Node.js puis exécutez `node scripts/verifier-donnees.mjs` à la racine du projet. Le contrôle signale les erreurs, mais ne bloque pas à lui seul la publication GitHub Pages ; pensez à consulter son résultat.

## Proposer un mini-stage SANS compte GitHub (collègues et lycées)

Depuis l'accueil, le bouton **Proposer un mini-stage** ouvre `proposer.html`, un formulaire sur le site. Les contributeurs n'ont **pas besoin de créer un compte GitHub**.

### Activer la réception des propositions (configuration du responsable)

Ce dépôt étant un site statique GitHub Pages, il ne dispose pas d'un serveur pour recevoir les formulaires. L'envoi repose sur le service externe [FormSubmit](https://formsubmit.co/) (relais par e-mail, sans compte à créer pour le contributeur ni pour le destinataire).

1. Définir une **adresse e-mail professionnelle de coordination** autorisée à recevoir les offres. Ne pas utiliser de données personnelles d'élèves.
2. Dans `data/site-config.json`, renseigner `"email_propositions": "votre-adresse-professionnelle@exemple.fr"`, puis valider le commit.
3. Envoyer une première proposition de test sur `proposer.html`. FormSubmit envoie un e-mail d'activation à cette adresse : **valider le lien reçu**. Les formulaires seront ensuite adressés à cette boîte. Les propositions reçues ne sont **jamais publiées automatiquement**.
4. Vérifier chaque proposition reçue, ouvrir `admin.html`, ajouter la fiche, exporter `mini-stages.json`, puis remplacer `data/mini-stages.json` sur GitHub et valider le commit. Les nouvelles fiches sont datées au moment de l'export. **Si la publication est effectuée un autre jour, corriger manuellement leur `date_publication` dans le JSON à la date effective de publication.**

**Sans adresse configurée**, la page offre un formulaire remplissable et les boutons **Télécharger ma proposition** / **Copier les informations**, mais l'envoi direct est désactivé. Il reste une étape de configuration nécessaire.

Avant d'utiliser FormSubmit dans un cadre scolaire, faire valider le choix de ce sous-traitant externe et l'information relative au traitement des coordonnées professionnelles par l'organisme responsable. Ne recueillir **aucun nom ni aucune information personnelle d'élève**.

### Procédure facultative GitHub (pour utilisateurs ayant un compte)

Le formulaire GitHub historique `.github/ISSUE_TEMPLATE/proposer-mini-stage.yml` reste disponible pour les personnes qui préfèrent une contribution via Issues. Le propriétaire du dépôt peut valider une issue vérifiée par le commentaire exact `/publier-mini-stage` pour déclencher le workflow automatisé. Les contributions reçues par e-mail ne passent pas par ce workflow et doivent être publiées depuis `admin.html`.

### Calcul de la période des demandes

Les dates d'inscription sont distinctes des dates du mini-stage. Chaque fiche possède :

- `date_publication` : date fixe de première mise en ligne, en `AAAA-MM-JJ`. Pour les deux offres initiales, cette valeur est `2026-11-16`.
- `date_ouverture_inscription` : si renseignée, cette date s'applique ; sinon, le site prend `date_publication`.
- `date_limite_inscription` : si renseignée, cette date s'applique ; sinon, le site prend le **1er mai suivant l'ouverture des demandes**, inclus. Par exemple, publication le 16 novembre 2026 → clôture le 1er mai 2027.
- Toute date explicitement communiquée par le lycée est prioritaire sur le calcul par défaut.

**Important :** si `date_publication` est manquante pour une fiche sans date d'ouverture, le site indique « Période à confirmer », afin de ne pas ouvrir arbitrairement une demande au jour de la visite. Ne pas remplir cette date avec une date supposée.

### Feu de signalisation des inscriptions

- **Vert – Inscription possible** : les deux dates de la période de demandes sont connues et le jour actuel est compris entre elles, bornes incluses, et aucune fermeture n'est signalée.
- **Rouge – Inscription terminée** : la période est clôturée, le mini-stage est passé ou le nombre annoncé de places est égal à zéro.
- **Gris – À confirmer / ouverture à venir** : la période n'a pas commencé ou une date indispensable à son calcul manque.

Les libellés sont affichés en texte à côté des feux, pour rester accessibles sans perception des couleurs.

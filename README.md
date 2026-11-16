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

Les résultats sont automatiquement triés par date. Les filtres permettent de chercher par mots-clés, domaine, commune, période et statut. Une date passée, une date limite dépassée et un nombre de places à zéro sont distingués. Un mini-stage dont l'échéance n'est pas dépassée reste **à confirmer auprès du lycée**.

## 4. Mode démonstration (séparé des vraies offres)

Le catalogue réel lit **uniquement** `data/mini-stages.json`, qui est vide à la livraison.

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

## Proposer un mini-stage depuis le site (collègues et lycées)

Le bouton **Proposer un mini-stage** ouvre la page `proposer.html`. Elle renvoie vers un formulaire GitHub, accessible à toute personne disposant d'un **compte GitHub** gratuit.

- Le lycée ou la collègue soumet les informations de l'offre via l'issue form `.github/ISSUE_TEMPLATE/proposer-mini-stage.yml`.
- La proposition est **publique sur GitHub**, mais n'est pas affichée immédiatement dans le catalogue. Aucune donnée personnelle d'élève ne doit être saisie.
- Le propriétaire du dépôt vérifie l'offre dans l'onglet **Issues**. Pour la publier, il ajoute **exactement** le commentaire `/publier-mini-stage` sur la proposition correspondante.
- Le workflow `.github/workflows/publier-mini-stage.yml` vérifie le formulaire, met à jour `data/mini-stages.json`, puis ferme l'issue. Il ne fonctionne que pour un commentaire du propriétaire du dépôt et nécessite GitHub Actions activé avec les permissions d'écriture du `GITHUB_TOKEN`.
- Si la vérification échoue, consulter l'onglet **Actions** puis corriger la proposition avant de relancer la validation par un nouveau commentaire `/publier-mini-stage`. Le formulaire ne publie **jamais** automatiquement des offres non vérifiées.

**L'inscription de l'élève ne se fait pas sur ce site.** Le secrétariat de son établissement scolaire envoie la demande dans la période indiquée (date d'ouverture et date de clôture). Le lycée d'accueil revient vers cet établissement et lui envoie une convention.

### Feu de signalisation des inscriptions

- **Vert – Inscription possible** : les deux dates de la période de demandes sont connues et le jour actuel est compris entre elles, bornes incluses, et aucune fermeture n'est signalée.
- **Rouge – Inscription terminée** : la période est clôturée, le mini-stage est passé ou le nombre annoncé de places est égal à zéro.
- **Gris – À confirmer / ouverture à venir** : la période n'a pas commencé ou une des dates nécessaires manque. Le site n'affiche jamais un feu vert sur la base d'une seule date.

Les libellés sont affichés en texte à côté des feux, pour rester accessibles sans perception des couleurs.

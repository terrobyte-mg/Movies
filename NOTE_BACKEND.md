# Note pour le Développeur Backend (MADAMOV)

Bonjour ! Ce document a été conçu pour vous faciliter l'intégration du backend avec l'interface frontend de **MADAMOV**. 
Toutes les variables, sélecteurs et fonctions du frontend ont été écrits en **français** pour assurer une cohérence et une compréhension maximale au sein de l'équipe lors des présentations.

---

## 1. Structure du Frontend et Points d'Accès

Le projet se compose de deux dossiers principaux :
- `/admin/` : Pages destinées à l'administration (Inscription, Tableau de Bord, Catégories).
- `/utilisateur/` : Pages de consultation de films pour les clients.

Les interactions dynamiques actuelles sont gérées dans les fichiers :
- `/admin/admin.js` : Logique de l'administration.
- `/utilisateur/utilisateur.js` : Logique de l'espace utilisateur.

---

## 2. Intégration de la Base de Données (Suggestions)

Voici les correspondances suggérées pour la base de données :

### Table `Utilisateurs`
*   `id` : Clé primaire
*   `nom_complet` : Chaîne de caractères (Requis)
*   `email` : Chaîne unique (Requis)
*   `nom_utilisateur` : Chaîne unique (Requis)
*   `mot_de_passe` : Haché (ex: bcrypt)
*   `role` : Énumération (`Administrateur`, `Super Administrateur`, `Utilisateur Premium`, `Utilisateur`)

### Table `Films`
*   `id` : Clé primaire
*   `titre` : Chaîne de caractères
*   `realisateur` : Chaîne de caractères
*   `acteurs` : Texte / Liste de chaînes
*   `synopsis` : Texte
*   `langue` : Chaîne (VF, VOSTFR)
*   `qualite` : Chaîne (4K, HD, etc.)
*   `budget` : Nombre décimal / entier
*   `annee_sortie` : Entier
*   `url_video` : URL du flux vidéo / fichier local
*   `url_affiche` : URL de l'image de l'affiche (poster)
*   `vues` : Entier (compteur)
*   `recherches` : Entier (compteur pour la popularité)

### Table `Categories`
*   `id` : Clé primaire
*   `nom` : Chaîne (ex: Action, Drame, Romance)
*   `description` : Texte
*   `icone` : Nom de l'icône ou classe SVG
*   `statut` : Énumération (`Publiée`, `Brouillon`, `Archivée`)
*   `date_ajout` : Date / Horodatage

### Table `Commentaires`
*   `id` : Clé primaire
*   `film_id` : Clé étrangère vers `Films`
*   `utilisateur_nom` : Chaîne (Nom de l'auteur)
*   `badge_utilisateur` : Chaîne (ex: `Premium`, `VIP`)
*   `note` : Entier (1 à 5 étoiles)
*   `texte` : Texte
*   `date_publication` : Horodatage

---

## 3. Branchement des APIs (Points de Liaison)

Pour rendre les pages dynamiques avec votre serveur, vous devrez remplacer les données fictives ("mockups") dans les fichiers Javascript par des requêtes HTTP (ex: `fetch()`).

### Dans `/admin/admin.js` :
1.  **Récupération des statistiques** : Remplacer l'initialisation de `chiffresStatistiques` par un appel API vers `/api/admin/statistiques`.
2.  **Tableau des catégories** : Remplacer la fonction `chargerCategories()` pour effectuer un `fetch('/api/categories')` et générer dynamiquement les lignes du tableau.
3.  **Actions Rapides (Ajouter/Supprimer)** : Lier le bouton "Ajouter une catégorie" à un formulaire modal qui envoie une requête `POST` vers `/api/categories`.

### Dans `/utilisateur/utilisateur.js` :
1.  **Carrousel Tendance** : Remplacer `filmsTendances` par un appel à `/api/films/tendances`.
2.  **Lecture de film** : La fonction `ouvrirFicheFilm(filmId)` doit faire un `fetch('/api/films/' + filmId)` pour charger les détails du film, l'URL de sa vidéo, et ses commentaires associés depuis `/api/films/' + filmId + '/commentaires`.
3.  **Ajout de commentaire** : La fonction `ajouterCommentaire()` doit envoyer une requête `POST` vers `/api/commentaires` avec le corps `{ film_id, texte, note }`.

---

## 4. Authentification et Sessions

*   **Inscription Admin** (`/admin/inscription.html`) : Le formulaire envoie les données d'inscription au backend. Le backend doit valider et enregistrer l'administrateur, puis rediriger vers le tableau de bord (`/admin/index.html`) en créant un jeton de session (JWT ou Cookie de session).
*   **Sécurisation** : Pensez à implémenter un intercepteur ou middleware côté serveur pour vérifier que seul un utilisateur ayant le rôle d'administrateur peut accéder aux APIs de `/api/admin/*` et aux pages d'administration.

Bon code à vous ! Si vous avez des questions sur la structure du HTML/CSS, réferrez-vous aux commentaires du code source.


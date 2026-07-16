-- ==========================================================
-- Migration : onboarding (choix des genres préférés)
-- ==========================================================

-- 1. Marque si l'utilisateur a terminé son onboarding initial
ALTER TABLE utilisateurs
    ADD COLUMN onboarding_complete TINYINT(1) NOT NULL DEFAULT 0 AFTER est_suspendue;

-- 2. Table de liaison utilisateur <-> genres préférés (many-to-many),
--    sur le même modèle que contenu_genres.
CREATE TABLE utilisateur_genres_preferes (
    utilisateur_id INT(10) UNSIGNED NOT NULL,
    genre_id INT(10) UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (utilisateur_id, genre_id),
    CONSTRAINT fk_ugp_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    CONSTRAINT fk_ugp_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Remarque : les comptes déjà existants auront onboarding_complete = 0
-- par défaut, donc ils verront l'écran d'onboarding à leur prochaine
-- connexion. Si tu préfères épargner cet écran aux comptes déjà actifs,
-- exécute plutôt la ligne suivante juste après la migration :
-- UPDATE utilisateurs SET onboarding_complete = 1 WHERE is_actif = 1 OR date_creation < NOW();

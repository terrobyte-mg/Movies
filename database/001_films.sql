CREATE TABLE IF NOT EXISTS types_contenus (
    code VARCHAR(30) PRIMARY KEY,
    libelle VARCHAR(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO types_contenus (code, libelle) VALUES
('film', 'Film')
ON DUPLICATE KEY UPDATE libelle = VALUES(libelle);

CREATE TABLE IF NOT EXISTS genres (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(80) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contenus (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type_code VARCHAR(30) NOT NULL DEFAULT 'film',
    titre VARCHAR(255) NOT NULL,
    realisateur VARCHAR(160) NOT NULL,
    synopsis TEXT NOT NULL,
    duree_minutes INT NOT NULL,
    annee_sortie YEAR NOT NULL,
    poster VARCHAR(255) NOT NULL,
    url_trailer VARCHAR(255) NULL,
    video_path VARCHAR(255) NULL,
    nombre_vues BIGINT NOT NULL DEFAULT 0,
    est_publie TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contenus_type FOREIGN KEY (type_code) REFERENCES types_contenus(code),
    UNIQUE KEY uniq_contenu_type_titre_annee (type_code, titre, annee_sortie),
    INDEX idx_contenus_type_publication (type_code, est_publie),
    INDEX idx_contenus_annee (annee_sortie),
    INDEX idx_contenus_vues (nombre_vues)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contenu_genres (
    contenu_id INT UNSIGNED NOT NULL,
    genre_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (contenu_id, genre_id),
    CONSTRAINT fk_contenu_genres_contenu FOREIGN KEY (contenu_id) REFERENCES contenus(id) ON DELETE CASCADE,
    CONSTRAINT fk_contenu_genres_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notes_contenus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contenu_id INT UNSIGNED NOT NULL,
    utilisateur_id INT UNSIGNED NOT NULL,
    note TINYINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notes_contenu FOREIGN KEY (contenu_id) REFERENCES contenus(id) ON DELETE CASCADE,
    CONSTRAINT fk_notes_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    CONSTRAINT chk_notes_valeur CHECK (note BETWEEN 1 AND 5),
    UNIQUE KEY uniq_note_utilisateur_contenu (contenu_id, utilisateur_id)
) ENGINE=InnoDB;

INSERT INTO genres (nom, slug) VALUES
('Action', 'action'),
('Aventure', 'aventure'),
('Animation', 'animation'),
('Biopic', 'biopic'),
('Comedie', 'comedie'),
('Crime', 'crime'),
('Documentaire', 'documentaire'),
('Drame', 'drame'),
('Fantastique', 'fantastique'),
('Fantasy', 'fantasy'),
('Guerre', 'guerre'),
('Historique', 'historique'),
('Horreur', 'horreur'),
('Mystere', 'mystere'),
('Romance', 'romance'),
('Science-fiction', 'science-fiction'),
('Sport', 'sport'),
('Thriller', 'thriller')
ON DUPLICATE KEY UPDATE nom = VALUES(nom);

INSERT INTO contenus (
    type_code, titre, realisateur, synopsis, duree_minutes, annee_sortie,
    poster, url_trailer, video_path, nombre_vues, est_publie
) VALUES
('film', 'The Batman', 'Matt Reeves', 'Batman enquete sur une serie de meurtres qui revelent la corruption profonde de Gotham.', 176, 2022, 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg', 'https://www.youtube.com/watch?v=mqqft2x_Aa4', 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4', 1240, 1),
('film', 'Top Gun: Maverick', 'Joseph Kosinski', 'Pete Maverick Mitchell forme une nouvelle generation de pilotes pour une mission presque impossible.', 130, 2022, 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDabo8diEhkHPm3.jpg', 'https://www.youtube.com/watch?v=qSqVVswa420', 'https://assets.mixkit.co/videos/preview/mixkit-flying-over-a-city-at-night-4158-large.mp4', 1850, 1),
('film', 'Oppenheimer', 'Christopher Nolan', 'Le portrait du physicien J. Robert Oppenheimer et de la creation de la bombe atomique.', 180, 2023, 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', 'https://www.youtube.com/watch?v=uYPbbksJxIg', 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4', 2130, 1),
('film', 'Dune: Part Two', 'Denis Villeneuve', 'Paul Atreides s allie aux Fremen et poursuit sa vengeance sur Arrakis.', 166, 2024, 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', 'https://www.youtube.com/watch?v=Way9Dexny3w', 'https://assets.mixkit.co/videos/preview/mixkit-flying-over-a-city-at-night-4158-large.mp4', 2780, 1),
('film', 'Parasite', 'Bong Joon-ho', 'Une famille pauvre infiltre peu a peu le quotidien d une famille tres riche.', 132, 2019, 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 'https://www.youtube.com/watch?v=5xH0HfJHsaY', 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4', 1630, 1)
ON DUPLICATE KEY UPDATE titre = VALUES(titre);

INSERT IGNORE INTO contenu_genres (contenu_id, genre_id)
SELECT c.id, g.id FROM contenus c JOIN genres g ON g.nom IN ('Action', 'Crime', 'Drame') WHERE c.titre = 'The Batman';
INSERT IGNORE INTO contenu_genres (contenu_id, genre_id)
SELECT c.id, g.id FROM contenus c JOIN genres g ON g.nom IN ('Action', 'Aventure', 'Drame') WHERE c.titre = 'Top Gun: Maverick';
INSERT IGNORE INTO contenu_genres (contenu_id, genre_id)
SELECT c.id, g.id FROM contenus c JOIN genres g ON g.nom IN ('Biopic', 'Drame', 'Historique') WHERE c.titre = 'Oppenheimer';
INSERT IGNORE INTO contenu_genres (contenu_id, genre_id)
SELECT c.id, g.id FROM contenus c JOIN genres g ON g.nom IN ('Science-fiction', 'Aventure', 'Drame') WHERE c.titre = 'Dune: Part Two';
INSERT IGNORE INTO contenu_genres (contenu_id, genre_id)
SELECT c.id, g.id FROM contenus c JOIN genres g ON g.nom IN ('Thriller', 'Drame') WHERE c.titre = 'Parasite';

CREATE TABLE IF NOT EXISTS favoris (
    utilisateur_id INT UNSIGNED NOT NULL,
    contenu_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY(utilisateur_id, contenu_id),

    CONSTRAINT fk_favoris_user
        FOREIGN KEY(utilisateur_id)
        REFERENCES utilisateurs(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_favoris_contenu
        FOREIGN KEY(contenu_id)
        REFERENCES contenus(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commentaires_contenus (
                                                     id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                     contenu_id INT(10) UNSIGNED NOT NULL,
                                                     utilisateur_id INT(10) UNSIGNED NOT NULL,
                                                     commentaire TEXT NOT NULL,
                                                     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                                     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                                                     INDEX idx_commentaires_contenu (contenu_id),
                                                     INDEX idx_commentaires_utilisateur (utilisateur_id),

                                                     CONSTRAINT fk_commentaires_contenu
                                                         FOREIGN KEY (contenu_id) REFERENCES contenus (id)
                                                             ON DELETE CASCADE,

                                                     CONSTRAINT fk_commentaires_utilisateur
                                                         FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id)
                                                             ON DELETE CASCADE
) ENGINE=InnoDB;
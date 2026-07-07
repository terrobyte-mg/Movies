-- ============================================================
-- Table des commentaires sur les contenus (films, séries, animés...)
-- À exécuter sur la base existante (même logique que notes_contenus / favoris)
-- ============================================================

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
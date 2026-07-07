<?php

require_once(__DIR__ . '/../core/Database.php');

class CommentaireRepository {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getPdo();
    }

    /**
     * Liste des commentaires d'un contenu (film), du plus récent au plus ancien.
     */
    public function listByContenu(int $contenuId, int $limit = 100): array {
        try {
            $limit = max(1, min($limit, 200));

            $stmt = $this->pdo->prepare(
                "SELECT
                    cc.id,
                    cc.contenu_id,
                    cc.utilisateur_id,
                    cc.commentaire,
                    cc.created_at,
                    cc.updated_at,
                    u.nom_utilisateur,
                    u.url_photo_profil
                 FROM commentaires_contenus cc
                 JOIN utilisateurs u ON u.id = cc.utilisateur_id
                 WHERE cc.contenu_id = :contenu_id
                 ORDER BY cc.created_at DESC
                 LIMIT $limit"
            );
            $stmt->execute(['contenu_id' => $contenuId]);

            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error listByContenu: " . $e->getMessage());
            return [];
        }
    }

    public function count(int $contenuId): int {
        try {
            $stmt = $this->pdo->prepare(
                "SELECT COUNT(*) FROM commentaires_contenus WHERE contenu_id = :contenu_id"
            );
            $stmt->execute(['contenu_id' => $contenuId]);
            return (int) $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error count comments: " . $e->getMessage());
            return 0;
        }
    }

    public function create(int $contenuId, int $utilisateurId, string $commentaire): ?int {
        try {
            $stmt = $this->pdo->prepare(
                "INSERT INTO commentaires_contenus (contenu_id, utilisateur_id, commentaire)
                 VALUES (:contenu_id, :utilisateur_id, :commentaire)"
            );
            $stmt->execute([
                'contenu_id' => $contenuId,
                'utilisateur_id' => $utilisateurId,
                'commentaire' => $commentaire
            ]);

            return (int) $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error create comment: " . $e->getMessage());
            return null;
        }
    }

    public function findById(int $id): ?array {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM commentaires_contenus WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch();
            return $row ?: null;
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error findById comment: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Supprime un commentaire.
     * - Un utilisateur normal ne peut supprimer que ses propres commentaires.
     * - Un admin peut supprimer n'importe quel commentaire (modération).
     */
    public function delete(int $id, int $utilisateurId, bool $isAdmin = false): bool {
        try {
            if ($isAdmin) {
                $stmt = $this->pdo->prepare("DELETE FROM commentaires_contenus WHERE id = :id");
                $stmt->execute(['id' => $id]);
                return $stmt->rowCount() > 0;
            }

            $stmt = $this->pdo->prepare(
                "DELETE FROM commentaires_contenus WHERE id = :id AND utilisateur_id = :utilisateur_id"
            );
            $stmt->execute(['id' => $id, 'utilisateur_id' => $utilisateurId]);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error delete comment: " . $e->getMessage());
            return false;
        }
    }
}
<?php

require_once(__DIR__ . '/../core/Database.php');
require_once(__DIR__ . '/../entities/Film.php');

class FavorisRepository {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getPdo();
    }

    /**
     * Vérifie si un film est dans les favoris d'un utilisateur.
     */
    public function isFavori(int $userId, int $contenuId): bool {
        try {
            $stmt = $this->pdo->prepare(
                "SELECT COUNT(*) FROM favoris WHERE utilisateur_id = :user_id AND contenu_id = :contenu_id"
            );
            $stmt->execute([
                "user_id" => $userId,
                "contenu_id" => $contenuId
            ]);
            return (int) $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error isFavori: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Ajoute ou retire un film des favoris (bascule).
     *
     * @return bool|null true si ajouté, false si retiré, null en cas d'erreur
     */
    public function toggle(int $userId, int $contenuId): ?bool {
        try {
            if ($this->isFavori($userId, $contenuId)) {
                $stmt = $this->pdo->prepare(
                    "DELETE FROM favoris WHERE utilisateur_id = :user_id AND contenu_id = :contenu_id"
                );
                $stmt->execute([
                    "user_id" => $userId,
                    "contenu_id" => $contenuId
                ]);
                return false;
            }

            $stmt = $this->pdo->prepare(
                "INSERT INTO favoris (utilisateur_id, contenu_id, created_at) VALUES (:user_id, :contenu_id, NOW())"
            );
            $stmt->execute([
                "user_id" => $userId,
                "contenu_id" => $contenuId
            ]);
            return true;
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error toggle favori: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Liste des films favoris d'un utilisateur, les plus récents en premier.
     */
    public function listByUser(int $userId): array {
        try {
            $stmt = $this->pdo->prepare(
                "SELECT
                    c.*,
                    GROUP_CONCAT(DISTINCT g.nom ORDER BY g.nom SEPARATOR ',') AS genres,
                    COALESCE(AVG(n.note), 0) AS note_moyenne,
                    COUNT(DISTINCT n.id) AS nombre_notes
                 FROM favoris f
                 JOIN contenus c ON c.id = f.contenu_id
                 LEFT JOIN contenu_genres cg ON cg.contenu_id = c.id
                 LEFT JOIN genres g ON g.id = cg.genre_id
                 LEFT JOIN notes_contenus n ON n.contenu_id = c.id
                 WHERE f.utilisateur_id = :user_id AND c.type_code = 'film' AND c.est_publie = 1
                 GROUP BY c.id, f.created_at
                 ORDER BY f.created_at DESC"
            );
            $stmt->execute(["user_id" => $userId]);

            return array_map(fn($row) => Film::fromRow($row)->toArray(), $stmt->fetchAll());
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error listByUser favoris: " . $e->getMessage());
            return [];
        }
    }

    public function countByUser(int $userId): int {
        try {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM favoris WHERE utilisateur_id = :user_id");
            $stmt->execute(["user_id" => $userId]);
            return (int) $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error countByUser favoris: " . $e->getMessage());
            return 0;
        }
    }
}

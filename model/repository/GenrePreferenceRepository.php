<?php

require_once(__DIR__ . '/../core/Database.php');

/**
 * Gère les genres préférés choisis par un utilisateur lors de
 * l'onboarding (utilisés pour personnaliser les recommandations).
 */
class GenrePreferenceRepository {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getPdo();
    }

    /**
     * Remplace les préférences de genres d'un utilisateur.
     */
    public function savePreferences(int $userId, array $genreIds): bool {
        try {
            $this->pdo->beginTransaction();

            $this->pdo->prepare("DELETE FROM utilisateur_genres_preferes WHERE utilisateur_id = :id")
                ->execute(['id' => $userId]);

            $stmt = $this->pdo->prepare(
                "INSERT IGNORE INTO utilisateur_genres_preferes (utilisateur_id, genre_id) VALUES (:user_id, :genre_id)"
            );

            foreach ($genreIds as $genreId) {
                $stmt->execute([
                    'user_id' => $userId,
                    'genre_id' => (int) $genreId
                ]);
            }

            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("[" . date('d-M-Y H-i-s') . "] Error savePreferences: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Récupère les identifiants des genres préférés d'un utilisateur.
     */
    public function getPreferredGenreIds(int $userId): array {
        try {
            $stmt = $this->pdo->prepare(
                "SELECT genre_id FROM utilisateur_genres_preferes WHERE utilisateur_id = :id"
            );
            $stmt->execute(['id' => $userId]);
            return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error getPreferredGenreIds: " . $e->getMessage());
            return [];
        }
    }
}

<?php

require_once(__DIR__ . '/../core/Database.php');
require_once(__DIR__ . '/../entities/Film.php');

class FilmRepository {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getPdo();
    }

    public function listFilms(array $filters = [], bool $onlyPublished = true): array {
        try {
            [$where, $params] = $this->buildFilmFilters($filters, $onlyPublished);
            $orderBy = $this->resolveOrderBy($filters['sort'] ?? 'recent');
            $limit = max(1, min((int)($filters['limit'] ?? 60), 100));

            $sql = $this->baseFilmSelect() . "
                $where
                GROUP BY c.id
                $orderBy
                LIMIT $limit
            ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);

            return array_map(fn($row) => Film::fromRow($row)->toArray(), $stmt->fetchAll());
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error listFilms: " . $e->getMessage());
            return [];
        }
    }

    public function findFilmById(int $id, bool $onlyPublished = true): ?array
    {
        try {
            $where = "WHERE c.type_code = 'film' AND c.id = :id";
            if ($onlyPublished) {
                $where .= " AND c.est_publie = 1";
            }

            $sql = $this->baseFilmSelect() . "
                $where
                GROUP BY c.id
                LIMIT 1
            ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch();

            return $row ? Film::fromRow($row)->toArray() : null;
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error findFilmById: " . $e->getMessage());
            return null;
        }
    }

    public function createFilm(array $data): ?int
    {
        try {
            $this->pdo->beginTransaction();

            $stmt = $this->pdo->prepare(
                "INSERT INTO contenus (
                    type_code, titre, realisateur, synopsis, duree_minutes, annee_sortie,
                    poster, url_trailer, video_path, est_publie
                ) VALUES (
                    'film', :titre, :realisateur, :synopsis, :duree_minutes, :annee_sortie,
                    :poster, :url_trailer, :video_path, :est_publie
                )"
            );

            $stmt->execute($this->contentParams($data));
            $filmId = (int) $this->pdo->lastInsertId();
            $this->syncGenres($filmId, $data['genres'] ?? []);

            $this->pdo->commit();
            return $filmId;
        } catch (PDOException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("[" . date('d-M-Y H-i-s') . "] Error createFilm: " . $e->getMessage());
            return null;
        }
    }

    public function updateFilm(int $id, array $data): bool
    {
        try {
            $this->pdo->beginTransaction();

            $params = $this->contentParams($data);
            $params['id'] = $id;

            $stmt = $this->pdo->prepare(
                "UPDATE contenus
                 SET titre = :titre,
                     realisateur = :realisateur,
                     synopsis = :synopsis,
                     duree_minutes = :duree_minutes,
                     annee_sortie = :annee_sortie,
                     poster = :poster,
                     url_trailer = :url_trailer,
                     video_path = :video_path,
                     est_publie = :est_publie
                 WHERE id = :id AND type_code = 'film'"
            );

            $stmt->execute($params);
            $this->syncGenres($id, $data['genres'] ?? []);

            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("[" . date('d-M-Y H-i-s') . "] Error updateFilm: " . $e->getMessage());
            return false;
        }
    }

    public function deleteFilm(int $id): bool {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM contenus WHERE id = :id AND type_code = 'film'");
            return $stmt->execute(['id' => $id]);
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error deleteFilm: " . $e->getMessage());
            return false;
        }
    }

    public function incrementViews(int $id): bool {
        try {
            $stmt = $this->pdo->prepare(
                "UPDATE contenus SET nombre_vues = nombre_vues + 1 WHERE id = :id AND type_code = 'film' AND est_publie = 1"
            );
            return $stmt->execute(['id' => $id]);
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error incrementViews: " . $e->getMessage());
            return false;
        }
    }

    public function rateFilm(int $filmId, int $userId, int $note): bool {
        try {
            $stmt = $this->pdo->prepare(
                "INSERT INTO notes_contenus (contenu_id, utilisateur_id, note)
                 VALUES (:film_id, :user_id, :note)
                 ON DUPLICATE KEY UPDATE note = VALUES(note), updated_at = CURRENT_TIMESTAMP"
            );
            return $stmt->execute([
                'film_id' => $filmId,
                'user_id' => $userId,
                'note' => $note
            ]);
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error rateFilm: " . $e->getMessage());
            return false;
        }
    }

    public function getRateFilm(int $filmId, int $userId): int {

        try {
            $stmt = $this->pdo->prepare(
                "SELECT note FROM notes_contenus WHERE contenu_id = :film_id AND utilisateur_id = :user_id"
            );
            $stmt->execute(['film_id' => $filmId, 'user_id' => $userId]);
            return $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error getRateFilm: " . $e->getMessage());
            return 0;
        }

    }

    public function listGenres(): array
    {
        try {
            $stmt = $this->pdo->query(
                "SELECT g.id, g.nom, COUNT(cg.contenu_id) AS total
                 FROM genres g
                 LEFT JOIN contenu_genres cg ON cg.genre_id = g.id
                 LEFT JOIN contenus c 
                    ON c.id = cg.contenu_id 
                    AND c.type_code = 'film' 
                    AND c.est_publie = 1
                 GROUP BY g.id, g.nom
                 ORDER BY g.nom"
            );
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error listGenres: " . $e->getMessage());
            return [];
        }
    }

    public function listYears(): array
    {
        try {
            $stmt = $this->pdo->query(
                "SELECT annee_sortie AS annee, COUNT(*) AS total
                 FROM contenus
                 WHERE type_code = 'film' AND est_publie = 1
                 GROUP BY annee_sortie
                 ORDER BY annee_sortie DESC"
            );
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error listYears: " . $e->getMessage());
            return [];
        }
    }

    public function stats(): array
    {
        try {
            $stmt = $this->pdo->query(
                "SELECT
                    COUNT(*) AS total_films,
                    COALESCE(SUM(nombre_vues), 0) AS total_vues
                 FROM contenus
                 WHERE type_code = 'film'"
            );
            $stats = $stmt->fetch() ?: ['total_films' => 0, 'total_vues' => 0];

            $noteStmt = $this->pdo->query(
                "SELECT COALESCE(AVG(note), 0) AS note_moyenne FROM notes_contenus n
                 JOIN contenus c ON c.id = n.contenu_id
                 WHERE c.type_code = 'film'"
            );
            $stats['note_moyenne'] = round((float) ($noteStmt->fetchColumn() ?: 0), 1);

            return $stats;
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error film stats: " . $e->getMessage());
            return ['total_films' => 0, 'total_vues' => 0, 'note_moyenne' => 0];
        }
    }

    /**
     * Le film le plus vu (pour le KPI "Film populaire" du dashboard admin).
     */
    public function mostViewed(): ?array
    {
        try {
            $sql = $this->baseFilmSelect() . "
                WHERE c.type_code = 'film' AND c.est_publie = 1
                GROUP BY c.id
                ORDER BY c.nombre_vues DESC
                LIMIT 1
            ";

            $stmt = $this->pdo->query($sql);
            $row = $stmt->fetch();

            return $row ? Film::fromRow($row)->toArray() : null;
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error mostViewed: " . $e->getMessage());
            return null;
        }
    }

    private function baseFilmSelect(): string {
        return "SELECT
                    c.*,
                    GROUP_CONCAT(DISTINCT g.nom ORDER BY g.nom SEPARATOR ',') AS genres,
                    COALESCE(AVG(n.note), 0) AS note_moyenne,
                    COUNT(DISTINCT n.id) AS nombre_notes
                FROM contenus c
                LEFT JOIN contenu_genres cg ON cg.contenu_id = c.id
                LEFT JOIN genres g ON g.id = cg.genre_id
                LEFT JOIN notes_contenus n ON n.contenu_id = c.id";
    }

    private function buildFilmFilters(array $filters, bool $onlyPublished): array {
        $where = ["c.type_code = 'film'"];
        $params = [];

        if ($onlyPublished) {
            $where[] = "c.est_publie = 1";
        }

        if (!empty($filters['q'])) {
            $where[] = "(c.titre LIKE :q OR c.realisateur LIKE :q OR c.synopsis LIKE :q)";
            $params['q'] = '%' . trim($filters['q']) . '%';
        }

        if (!empty($filters['genre'])) {
            $where[] = "EXISTS (
                SELECT 1 FROM contenu_genres cg2
                JOIN genres g2 ON g2.id = cg2.genre_id
                WHERE cg2.contenu_id = c.id AND g2.nom = :genre
            )";
            $params['genre'] = trim($filters['genre']);
        }

        if (!empty($filters['year'])) {
            $where[] = "c.annee_sortie = :year";
            $params['year'] = (int) $filters['year'];
        }

        return ['WHERE ' . implode(' AND ', $where), $params];
    }

    private function resolveOrderBy(string $sort): string {
        return match ($sort) {
            'views' => 'ORDER BY c.nombre_vues DESC, c.created_at DESC',
            'rating' => 'ORDER BY note_moyenne DESC, nombre_notes DESC',
            'title' => 'ORDER BY c.titre ASC',
            'oldest' => 'ORDER BY c.annee_sortie ASC, c.titre ASC',
            default => 'ORDER BY c.annee_sortie DESC, c.created_at DESC'
        };
    }

    private function contentParams(array $data): array {
        return [
            'titre' => $data['titre'],
            'realisateur' => $data['realisateur'],
            'synopsis' => $data['synopsis'],
            'duree_minutes' => (int) $data['duree_minutes'],
            'annee_sortie' => (int) $data['annee_sortie'],
            'poster' => $data['poster'],
            'url_trailer' => $data['url_trailer'] ?: null,
            'video_path' => $data['video_path'] ?: null,
            'est_publie' => !empty($data['est_publie']) ? 1 : 0
        ];
    }

    private function syncGenres(int $filmId, array|string $genres): void {
        $genres = is_array($genres) ? $genres : explode(',', $genres);

        $genres = array_values(array_unique(array_filter(array_map('trim', $genres))));

        $this->pdo->prepare("DELETE FROM contenu_genres WHERE contenu_id = :id")->execute(['id' => $filmId]);

        foreach ($genres as $genre) {
            $genreId = $this->getOrCreateGenre($genre);
            $stmt = $this->pdo->prepare(
                "INSERT IGNORE INTO contenu_genres (contenu_id, genre_id) VALUES (:contenu_id, :genre_id)"
            );
            $stmt->execute(['contenu_id' => $filmId, 'genre_id' => $genreId]);
        }
    }

    private function getOrCreateGenre(string $nom): int {
        $slug = $this->slugify($nom);

        $stmt = $this->pdo->prepare("SELECT id FROM genres WHERE slug = :slug");
        $stmt->execute(['slug' => $slug]);
        $id = $stmt->fetchColumn();

        if ($id) {
            return (int) $id;
        }

        $insert = $this->pdo->prepare("INSERT INTO genres (nom, slug) VALUES (:nom, :slug)");
        $insert->execute(['nom' => $nom, 'slug' => $slug]);

        return (int) $this->pdo->lastInsertId();
    }

    private function slugify(string $value): string {
        $value = strtolower(trim($value));
        $value = iconv('UTF-8', 'ASCII//TRANSLIT', $value) ?: $value;
        $value = preg_replace('/[^a-z0-9]+/', '-', $value);
        return trim($value, '-') ?: 'genre';
    }
}
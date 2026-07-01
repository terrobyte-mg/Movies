<?php

require_once(__DIR__ . '/../model/repository/FilmRepository.php');
require_once(__DIR__ . '/../middleware/AuthMiddleware.php');
require_once(__DIR__ . '/../middleware/ApiMiddleware.php');

class FilmController
{
    private FilmRepository $filmRepository;

    public function __construct()
    {
        $this->filmRepository = new FilmRepository();
    }

    /**
     * LISTE DES FILMS (API)
     */
    public function index(): array
    {
        ApiMiddleware::handle();

        $filters = [
            'q' => $_GET['q'] ?? null,
            'genre' => $_GET['genre'] ?? null,
            'year' => $_GET['year'] ?? null,
            'sort' => $_GET['sort'] ?? 'recent',
            'limit' => $_GET['limit'] ?? 60
        ];

        $films = $this->filmRepository->listFilms($filters);

        return [
            "success" => true,
            "data" => $films
        ];
    }

    /**
     * DETAILS D’UN FILM
     */
    public function show(int $id): array
    {
        ApiMiddleware::handle();

        $film = $this->filmRepository->findFilmById($id);

        if (!$film) {
            http_response_code(404);
            return [
                "success" => false,
                "message" => "Film introuvable"
            ];
        }

        // incrément vue (optionnel)
        $this->filmRepository->incrementViews($id);

        return [
            "success" => true,
            "data" => $film
        ];
    }

    /**
     * CREER UN FILM (ADMIN)
     */
    public function store(): array
    {
        if ($error = AuthMiddleware::handle()) {
            return $error;
        }

        ApiMiddleware::handle();

        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data) {
            return [
                "success" => false,
                "message" => "Données invalides"
            ];
        }

        $id = $this->filmRepository->createFilm($data);

        if (!$id) {
            return [
                "success" => false,
                "message" => "Erreur lors de la création"
            ];
        }

        return [
            "success" => true,
            "message" => "Film créé avec succès",
            "film_id" => $id
        ];
    }

    /**
     * UPDATE FILM (ADMIN)
     */
    public function update(int $id): array
    {
        if ($error = AuthMiddleware::handle()) {
            return $error;
        }

        ApiMiddleware::handle();

        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data) {
            return [
                "success" => false,
                "message" => "Données invalides"
            ];
        }

        $ok = $this->filmRepository->updateFilm($id, $data);

        return [
            "success" => $ok,
            "message" => $ok ? "Film mis à jour" : "Erreur mise à jour"
        ];
    }

    /**
     * SUPPRIMER FILM (ADMIN)
     */
    public function delete(int $id): array
    {
        if ($error = AuthMiddleware::handle()) {
            return $error;
        }

        ApiMiddleware::handle();

        $ok = $this->filmRepository->deleteFilm($id);

        return [
            "success" => $ok,
            "message" => $ok ? "Film supprimé" : "Erreur suppression"
        ];
    }

    /**
     * NOTE UN FILM
     */
    public function rate(int $filmId): array
    {
        if ($error = AuthMiddleware::handle()) {
            return $error;
        }

        ApiMiddleware::handle();

        $data = json_decode(file_get_contents("php://input"), true);

        $note = (int) ($data['note'] ?? 0);

        if ($note < 1 || $note > 5) {
            return [
                "success" => false,
                "message" => "Note invalide"
            ];
        }

        $userId = $_SESSION['user']['id'];

        $ok = $this->filmRepository->rateFilm($filmId, $userId, $note);

        return [
            "success" => $ok,
            "message" => $ok ? "Note enregistrée" : "Erreur note"
        ];
    }
}
<?php

require_once(__DIR__ . '/../model/repository/FilmRepository.php');
require_once(__DIR__ . '/../model/repository/CommentaireRepository.php');
require_once(__DIR__ . '/../model/repository/FavorisRepository.php');

class FilmController
{
    private FilmRepository $filmRepository;
    private CommentaireRepository $commentaireRepository;
    private FavorisRepository $favorisRepository;

    public function __construct()
    {
        $this->filmRepository = new FilmRepository();
        $this->commentaireRepository = new CommentaireRepository();
        $this->favorisRepository = new FavorisRepository();
    }

    /**
     * LISTE DES FILMS (API)
     */
    public function index(): array
    {
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
     * DETAILS D'UN FILM
     */
    public function show(int $id): array {
        $film = $this->filmRepository->findFilmById($id);

        if (!$film) {
            return [
                "success" => false,
                "message" => "Film introuvable"
            ];
        }

        $this->filmRepository->incrementViews($id);

        $film['est_favori'] = !empty($_SESSION['user']['id']) && $this->favorisRepository->isFavori((int)$_SESSION['user']['id'], $id);

        return [
            "success" => true,
            "data" => $film
        ];
    }

    /**
     * DETAILS D'UN FILM POUR L'ADMIN (édition)
     * Ne compte pas de vue et inclut aussi les films non publiés (brouillons).
     */
    public function adminShow(int $id): array
    {
        $film = $this->filmRepository->findFilmById($id, false);

        if (!$film) {
            return [
                "success" => false,
                "message" => "Film introuvable"
            ];
        }

        return [
            "success" => true,
            "data" => $film
        ];
    }

    /**
     * LISTE DES GENRES (pour les checkbox du formulaire admin)
     */
    public function genres(): array
    {
        return [
            "success" => true,
            "data" => $this->filmRepository->listGenres()
        ];
    }

    /**
     * CREER UN FILM (ADMIN)
     */
    public function store(): array
    {
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
        $ok = $this->filmRepository->deleteFilm($id);

        return [
            "success" => $ok,
            "message" => $ok ? "Film supprimé" : "Erreur suppression"
        ];
    }

    /**
     * NOTE UN FILM
     */
    public function rate(int $filmId): array {
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

    /**
     * PRENDRE LA NOTE CORRESPONDANT A L'UTILISATEUR ET AU FILM
     * A PARTIR DU FILM REPOSITORY
     * @param int $filmId
     * @return array
     */
    public function getRate(int $filmId): array {

        $userId = $_SESSION['user']['id'];
        $note = $this->filmRepository->getRateFilm($filmId, $userId);

        return [
            "success" => true,
            "data" => $note
        ];

    }

    /**
     * LISTE DES COMMENTAIRES D'UN FILM
     */
    public function comments(int $filmId): array
    {
        $film = $this->filmRepository->findFilmById($filmId);

        if (!$film) {
            return [
                "success" => false,
                "message" => "Film introuvable"
            ];
        }

        return [
            "success" => true,
            "data" => $this->commentaireRepository->listByContenu($filmId)
        ];
    }

    /**
     * AJOUTER UN COMMENTAIRE SUR UN FILM
     */
    public function addComment(int $filmId): array
    {
        if (empty($_SESSION['user']['id'])) {
            return [
                "success" => false,
                "message" => "Vous devez être connecté pour commenter"
            ];
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $texte = trim((string) ($data['commentaire'] ?? ''));

        if ($texte === '' || mb_strlen($texte) > 1000) {
            return [
                "success" => false,
                "message" => "Le commentaire doit contenir entre 1 et 1000 caractères"
            ];
        }

        $film = $this->filmRepository->findFilmById($filmId);
        if (!$film) {
            return [
                "success" => false,
                "message" => "Film introuvable"
            ];
        }

        $commentId = $this->commentaireRepository->create(
            $filmId,
            (int) $_SESSION['user']['id'],
            $texte
        );

        if (!$commentId) {
            return [
                "success" => false,
                "message" => "Erreur lors de la publication du commentaire"
            ];
        }

        return [
            "success" => true,
            "message" => "Commentaire publié",
            "comment_id" => $commentId
        ];
    }

    /**
     * AJOUTER / RETIRER UN FILM DES FAVORIS (bascule)
     */
    public function toggleFavori(int $filmId): array
    {
        if (empty($_SESSION['user']['id'])) {
            return [
                "success" => false,
                "message" => "Vous devez être connecté pour gérer vos favoris"
            ];
        }

        $film = $this->filmRepository->findFilmById($filmId);
        if (!$film) {
            return [
                "success" => false,
                "message" => "Film introuvable"
            ];
        }

        $resultat = $this->favorisRepository->toggle((int) $_SESSION['user']['id'], $filmId);

        if ($resultat === null) {
            return [
                "success" => false,
                "message" => "Erreur lors de la mise à jour des favoris"
            ];
        }

        return [
            "success" => true,
            "favori" => $resultat,
            "message" => $resultat ? "Ajouté aux favoris" : "Retiré des favoris"
        ];
    }

    /**
     * LISTE DES FILMS FAVORIS DE L'UTILISATEUR CONNECTÉ ("Ma liste")
     */
    public function myFavoris(): array
    {
        if (empty($_SESSION['user']['id'])) {
            return [
                "success" => false,
                "message" => "Vous devez être connecté"
            ];
        }

        return [
            "success" => true,
            "data" => $this->favorisRepository->listByUser((int) $_SESSION['user']['id'])
        ];
    }

    /**
     * SUPPRIMER UN COMMENTAIRE
     * (auteur du commentaire, ou admin pour modération)
     */
    public function deleteComment(int $commentId): array
    {
        if (empty($_SESSION['user']['id'])) {
            return [
                "success" => false,
                "message" => "Vous devez être connecté"
            ];
        }

        $isAdmin = ($_SESSION['user']['role_utilisateur'] ?? '') === 'admin';

        $ok = $this->commentaireRepository->delete(
            $commentId,
            (int) $_SESSION['user']['id'],
            $isAdmin
        );

        return [
            "success" => $ok,
            "message" => $ok ? "Commentaire supprimé" : "Suppression impossible"
        ];
    }
}
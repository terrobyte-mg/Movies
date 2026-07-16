<?php

require_once(__DIR__ . '/../model/repository/FilmRepository.php');
require_once(__DIR__ . '/../model/repository/GenrePreferenceRepository.php');
require_once(__DIR__ . '/../model/repository/UserRepository.php');

/**
 * Onboarding "première connexion" : sélection des genres préférés,
 * à la manière de Netflix.
 */
class OnboardingController
{
    private FilmRepository $filmRepository;
    private GenrePreferenceRepository $genrePreferenceRepository;
    private UserRepository $userRepository;

    public function __construct()
    {
        $this->filmRepository = new FilmRepository();
        $this->genrePreferenceRepository = new GenrePreferenceRepository();
        $this->userRepository = new UserRepository();
    }

    /**
     * Liste des genres disponibles pour l'écran d'onboarding.
     * Contrairement à FilmController::genres(), accessible à
     * tout utilisateur connecté (pas seulement l'admin).
     */
    public function genres(): array
    {
        return [
            "success" => true,
            "data" => $this->filmRepository->listGenres()
        ];
    }

    /**
     * Enregistre les genres sélectionnés et clôt l'onboarding.
     */
    public function submit(): array
    {
        if (empty($_SESSION['user']['id'])) {
            return [
                "success" => false,
                "message" => "Vous devez être connecté"
            ];
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $genreIds = array_values(array_unique(array_map('intval', $data['genre_ids'] ?? [])));

        if (count($genreIds) < 1) {
            return [
                "success" => false,
                "message" => "Sélectionnez au moins un genre pour continuer"
            ];
        }

        $userId = (int) $_SESSION['user']['id'];

        $this->genrePreferenceRepository->savePreferences($userId, $genreIds);
        $this->userRepository->markOnboardingComplete($userId);

        $_SESSION['user']['onboarding_complete'] = true;

        return [
            "success" => true,
            "message" => "Préférences enregistrées",
            "redirect" => "index.php?action=home"
        ];
    }

    /**
     * Permet de passer l'étape sans sélectionner de genre.
     */
    public function skip(): array
    {
        if (empty($_SESSION['user']['id'])) {
            return [
                "success" => false,
                "message" => "Vous devez être connecté"
            ];
        }

        $userId = (int) $_SESSION['user']['id'];
        $this->userRepository->markOnboardingComplete($userId);
        $_SESSION['user']['onboarding_complete'] = true;

        return [
            "success" => true,
            "message" => "Étape ignorée",
            "redirect" => "index.php?action=home"
        ];
    }
}

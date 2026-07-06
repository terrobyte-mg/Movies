<?php

require_once(__DIR__ . '/../model/repository/FilmRepository.php');

class AdminController
{
    private FilmRepository $filmRepository;

    public function __construct()
    {
        $this->filmRepository = new FilmRepository();
    }

    /**
     * Agrège les données affichées sur le tableau de bord admin :
     * KPIs (total films, film populaire) + derniers films ajoutés.
     */
    public function dashboard(): array
    {
        $stats = $this->filmRepository->stats();
        $filmPopulaire = $this->filmRepository->mostViewed();

        // onlyPublished = false : l'admin doit voir aussi les films non publiés
        $derniersFilms = $this->filmRepository->listFilms(
            ['sort' => 'recent', 'limit' => 5],
            false
        );

        return [
            "success" => true,
            "stats" => [
                "total_films" => (int) ($stats['total_films'] ?? 0),
                "total_vues" => (int) ($stats['total_vues'] ?? 0),
                "note_moyenne" => (float) ($stats['note_moyenne'] ?? 0),
                "film_populaire" => $filmPopulaire['titre'] ?? null,
                "film_populaire_vues" => $filmPopulaire['nombre_vues'] ?? 0
            ],
            "derniers_films" => $derniersFilms
        ];
    }
}
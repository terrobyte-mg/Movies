<?php

class Film {
    private ?int $id = null;
    private string $titre;
    private string $realisateur;
    private string $synopsis;
    private int $dureeMinutes;
    private int $anneeSortie;
    private string $poster;
    private ?string $urlTrailer;
    private ?string $video_path;
    private int $nombreVues = 0;
    private float $noteMoyenne = 0.0;
    private int $nombreNotes = 0;
    private array $genres = [];
    private bool $estPublie = true;

    public function __construct(
        string $titre,
        string $realisateur,
        string $synopsis,
        int $dureeMinutes,
        int $anneeSortie,
        string $poster,
        ?string $urlTrailer = null,
        ?string $video_path = null
    ) {
        $this->titre = $titre;
        $this->realisateur = $realisateur;
        $this->synopsis = $synopsis;
        $this->dureeMinutes = $dureeMinutes;
        $this->anneeSortie = $anneeSortie;
        $this->poster = $poster;
        $this->urlTrailer = $urlTrailer;
        $this->video_path = $video_path;
    }

    public static function fromRow(array $row): Film
    {
        $film = new Film(
            $row['titre'],
            $row['realisateur'],
            $row['synopsis'],
            (int) $row['duree_minutes'],
            (int) $row['annee_sortie'],
            $row['url_image'],
            $row['url_trailer'] ?? null,
            $row['url_video'] ?? null
        );

        $film->setId((int) $row['id']);
        $film->setNombreVues((int) ($row['nombre_vues'] ?? 0));
        $film->setNoteMoyenne((float) ($row['note_moyenne'] ?? 0));
        $film->setNombreNotes((int) ($row['nombre_notes'] ?? 0));
        $film->setEstPublie((bool) ($row['est_publie'] ?? true));

        $genres = [];
        if (!empty($row['genres'])) {
            $genres = array_values(
                array_filter(
                    array_map('trim', explode(',', $row['genres']))
                )
            );
        }
        $film->setGenres($genres);

        return $film;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'titre' => $this->titre,
            'realisateur' => $this->realisateur,
            'synopsis' => $this->synopsis,
            'duree_minutes' => $this->dureeMinutes,
            'duree_formatee' => $this->getDureeFormatee(),
            'annee_sortie' => $this->anneeSortie,
            'poster' => $this->poster,
            'url_trailer' => $this->urlTrailer,
            'video_path' => $this->video_path,
            'nombre_vues' => $this->nombreVues,
            'note_moyenne' => round($this->noteMoyenne, 1),
            'nombre_notes' => $this->nombreNotes,
            'genres' => $this->genres,
            'genre_principal' => $this->genres[0] ?? null,
            'est_publie' => $this->estPublie
        ];
    }

    public function getDureeFormatee(): string
    {
        $heures = intdiv($this->dureeMinutes, 60);
        $minutes = $this->dureeMinutes % 60;

        if ($heures <= 0) {
            return $minutes . 'min';
        }

        return $heures . 'h ' . str_pad((string) $minutes, 2, '0', STR_PAD_LEFT) . 'min';
    }

    public function getId(): ?int { return $this->id; }
    public function setId(?int $id): void { $this->id = $id; }
    public function setNombreVues(int $nombreVues): void { $this->nombreVues = $nombreVues; }
    public function setNoteMoyenne(float $noteMoyenne): void { $this->noteMoyenne = $noteMoyenne; }
    public function setNombreNotes(int $nombreNotes): void { $this->nombreNotes = $nombreNotes; }
    public function setGenres(array $genres): void { $this->genres = $genres; }
    public function setEstPublie(bool $estPublie): void { $this->estPublie = $estPublie; }
}

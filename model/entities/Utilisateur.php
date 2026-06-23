<?php

require_once __DIR__ . '/../abstract/Personne.php';
class Utilisateur extends Personne {

    private bool $isActif = false;
    public function __construct(string $nom_utilisateur, string $email, string $password_hash, ?string $url_photo_profil) {

        parent::__construct(
            nom_utilisateur : $nom_utilisateur,
            email: $email,
            password_hash: $password_hash,
            url_photo_profil: $url_photo_profil
        );

    }

    public function __toString() {
        return "nom_utilisateur : " . $this->nom_utilisateur . ", email : " . $this->email . ", role_utilisateurs : " . $this->roleUtilisateurs->value;
    }

    public function isActif(): bool {
        return $this->isActif;
    }

    public function setIsActif(bool $isActif): void {
        $this->isActif = $isActif;
    }

}
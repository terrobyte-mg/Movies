<?php

require_once (__DIR__ . '/../enums/RoleUtilisateurs.php');

abstract class Personne {

    protected ?int $id;
    protected string $nom_utilisateur;
    protected string $email;
    protected string $password_hash;
    protected DateTime $date_naissance;
    protected RoleUtilisateurs $roleUtilisateurs = RoleUtilisateurs::USER;
    protected ?string $url_photo_profil;

    public function __construct(string $nom_utilisateur, string $email, string $password_hash, ?string $url_photo_profil, DateTime $date_naissance) {
        $this->nom_utilisateur = $nom_utilisateur;
        $this->email = $email;
        $this->password_hash = $password_hash;
        $this->url_photo_profil = $url_photo_profil;
        $this->date_naissance = $date_naissance;
    }

    public function getNomUtilisateur(): string {
        return $this->nom_utilisateur;
    }

    public function setNomUtilisateur(string $nom_utilisateur): void {
        $this->nom_utilisateur = $nom_utilisateur;
    }

    public function getEmail(): string {
        return $this->email;
    }

    public function setEmail(string $email): void {
        $this->email = $email;
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function setId(?int $id): void {
        $this->id = $id;
    }

    public function getPasswordHash(): string {
        return $this->password_hash;
    }

    public function setPasswordHash(string $password_hash): void {
        $this->password_hash = $password_hash;
    }

    public function getRoleUtilisateurs(): RoleUtilisateurs {
        return $this->roleUtilisateurs;
    }

    public function setRoleUtilisateurs(string $roleUtilisateurs): void {
        if ($roleUtilisateurs === RoleUtilisateurs::USER->value) {
            $this->roleUtilisateurs = RoleUtilisateurs::USER;
        } elseif ($roleUtilisateurs === RoleUtilisateurs::ADMIN->value) {
            $this->roleUtilisateurs = RoleUtilisateurs::ADMIN;
        }
    }

    public function getUrlPhotoProfil(): ?string {
        return $this->url_photo_profil;
    }

    public function setUrlPhotoProfil(?string $url_photo_profil): void {
        $this->url_photo_profil = $url_photo_profil;
    }

    public function getDateNaissance(): DateTime {
        return $this->date_naissance;
    }

    public function setDateNaissance(DateTime $date_naissance): void {
        $this->date_naissance = $date_naissance;
    }

}
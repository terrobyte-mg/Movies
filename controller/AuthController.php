<?php

require_once (__DIR__ .'/../model/entities/Utilisateur.php');
require_once (__DIR__ .'/../model/core/Database.php');
require_once (__DIR__ .'/../model/repository/UserRepository.php');

class AuthController {

    private UserRepository $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    public function signup(): array {

        if (
            empty($_POST['nom_utilisateur']) ||
            empty($_POST['email_utilisateur']) ||
            empty($_POST['mot_de_passe1']) ||
            empty($_POST['mot_de_passe2'])
        ) {
            return [
                "success" => false,
                "message" => "Tous les champs sont obligatoires"
            ];
        }

        $nom_utilisateur = strip_tags(trim($_POST['nom_utilisateur']));
        $email = strip_tags(trim($_POST['email_utilisateur']));
        $mot_de_passe1 = $_POST['mot_de_passe1'];
        $mot_de_passe2 = $_POST['mot_de_passe2'];

        if (strlen($nom_utilisateur) < 3 || strlen($nom_utilisateur) > 50) {
            return [
                "success" => false,
                "message" => "Nom utilisateur invalide"
            ];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                "success" => false,
                "message" => "Email invalide"
            ];
        }

        if (strlen($mot_de_passe1) < 8) {
            return [
                "success" => false,
                "message" => "Mot de passe trop court (8 caractères minimum)"
            ];
        }

        if ($mot_de_passe1 !== $mot_de_passe2) {
            return [
                "success" => false,
                "message" => "Les mots de passe ne se correspondent pas"
            ];
        }

        if ($this->userRepository->emailExists($email)) {
            return [
                "success" => false,
                "message" => "Cet email est déjà utilisé"
            ];
        }

        $mot_de_passe_hash = password_hash($mot_de_passe1, PASSWORD_DEFAULT);

        $user = new Utilisateur(
            $nom_utilisateur,
            $email,
            $mot_de_passe_hash,
            null
        );

        $success = $this->userRepository->createUser($user);

        if (!$success) {
            return [
                "success" => false,
                "message" => "Erreur lors de la création du compte"
            ];
        } else {
            return [
                "success" => true,
                "message" => "Compte crée",
                "redirect" => "index.php?action=login"
            ];
        }


    }

    public function login(): array {

        if (empty($_POST['email_utilisateur']) || empty($_POST['mot_de_passe'])) {
            return [
                "success" => false,
                "message" => "Tous les champs sont obligatoires"
            ];
        }


        $email = strip_tags(trim($_POST['email_utilisateur']));
        $mot_de_passe = $_POST['mot_de_passe'];


        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                "success" => false,
                "message" => "Format d'email invalide"
            ];
        }

        $user = $this->userRepository->findByEmail($email);

        if ($user === null) {
            return [
                "success" => false,
                "message" => "Identifiants incorrects"
            ];
        }

        if (!password_verify($mot_de_passe, $user->getPasswordHash())) {
            return [
                "success" => false,
                "message" => "Identifiants incorrects"
            ];
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $this->userRepository->updateIsActif($user->getId(), true);

        $_SESSION['user'] = [
            'id' => $user->getId(),
            'role' => $user->getRoleUtilisateurs()->value,
            'nom_utilisateur' => $user->getNomUtilisateur(),
            'email' => $user->getEmail(),
            'is_actif' => $user->isActif()
        ];

        return [
            "success" => true,
            "message" => "Connexion réussie",
            "redirect" => "index.php?action=home"
        ];
    }

    public function logout(): array {

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $userId = $_SESSION['user']['id'] ?? null;

        if ($userId) {
            $this->userRepository->updateIsActif($_SESSION['user']['id'], false);
        }


        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();

        return [
            "success" => true,
            "message" => "Déconnecté",
            "redirect" => "index.php?action=login"
        ];
    }

}

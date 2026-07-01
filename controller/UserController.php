<?php


use Random\RandomException;

require_once(__DIR__ . '/../model/repository/UserRepository.php');

class UserController {

    private UserRepository $userRepository;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
    }

    public function getCurrentUser(): array
    {

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['user'])) {
            return [
                "success" => false,
                "message" => "Non authentifié"
            ];
        }

        return [
            "success" => true,
            "user" => $_SESSION['user']
        ];
    }

    /**
     * @throws RandomException
     */
    public function updateProfile(): array
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['user'])) {
            return [
                "success" => false,
                "message" => "Non authentifié"
            ];
        }

        $userId = $_SESSION['user']['id'];

        if (empty($_POST['nom_utilisateur']) || empty($_POST['email'])) {
            return [
                "success" => false,
                "message" => "Le nom d'utilisateur et l'email sont requis"
            ];
        }

        $username = strip_tags(trim((string) $_POST['nom_utilisateur']));
        $email = filter_var(trim((string) $_POST['email']), FILTER_SANITIZE_EMAIL);
        $nouveauMdp = (string) ($_POST['nouveau_mdp'] ?? '');
        $confirmerMdp = (string) ($_POST['confirmer_mdp'] ?? '');

        if (strlen($username) < 3 || strlen($username) > 50) {
            return [
                "success" => false,
                "message" => "Nom d'utilisateur invalide (entre 3 et 50 caractères)"
            ];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                "success" => false,
                "message" => "Format d'email invalide"
            ];
        }

        // Check if username already exists for another user
        if ($this->userRepository->usernameExists($username, $userId)) {
            return [
                "success" => false,
                "message" => "Ce nom d'utilisateur est déjà pris"
            ];
        }

        // Check if email already exists for another user
        if ($this->userRepository->emailExistsExclude($email, $userId)) {
            return [
                "success" => false,
                "message" => "Cet email est déjà associé à un autre compte"
            ];
        }

        $passwordHash = null;
        if (!empty($nouveauMdp)) {
            if (strlen($nouveauMdp) < 8) {
                return [
                    "success" => false,
                    "message" => "Le mot de passe doit faire au moins 8 caractères"
                ];
            }
            if ($nouveauMdp !== $confirmerMdp) {
                return [
                    "success" => false,
                    "message" => "Les mots de passe ne correspondent pas"
                ];
            }
            $passwordHash = password_hash($nouveauMdp, PASSWORD_DEFAULT);
        }

        $photoUrl = $_SESSION['user']['url_photo_profil'] ?? null;

        if (isset($_FILES['photo_profil']) && $_FILES['photo_profil']['error'] !== UPLOAD_ERR_NO_FILE) {
            if ($_FILES['photo_profil']['error'] !== UPLOAD_ERR_OK) {
                return [
                    "success" => false,
                    "message" => "Erreur lors du téléchargement de l'image"
                ];
            }

            $fileTmpPath = $_FILES['photo_profil']['tmp_name'];
            $fileSize = $_FILES['photo_profil']['size'];

            if (!is_uploaded_file($fileTmpPath) || !is_readable($fileTmpPath)) {
                return [
                    "success" => false,
                    "message" => "Image téléchargée invalide"
                ];
            }

            if ($fileSize > 2 * 1024 * 1024) {
                return [
                    "success" => false,
                    "message" => "L'image ne doit pas dépasser 2 Mo"
                ];
            }

            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = $finfo ? finfo_file($finfo, $fileTmpPath) : false;
            if ($finfo) {
                finfo_close($finfo);
            }

            $allowedMimeTypes = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                'image/webp' => 'webp'
            ];

            if (!isset($allowedMimeTypes[$mimeType]) || @getimagesize($fileTmpPath) === false) {
                return [
                    "success" => false,
                    "message" => "Format d'image non autorisé (jpg, jpeg, png, gif, webp uniquement)"
                ];
            }

            $newFileName = bin2hex(random_bytes(16)) . '.' . $allowedMimeTypes[$mimeType];

            $uploadFileDir = __DIR__ . '/../public/uploads/avatars/';
            if (!is_dir($uploadFileDir) && !@mkdir($uploadFileDir, 0755, true)) {
                return [
                    "success" => false,
                    "message" => "Impossible de préparer le dossier de téléchargement"
                ];
            }

            if (!is_writable($uploadFileDir)) {
                return [
                    "success" => false,
                    "message" => "Le dossier de téléchargement n'est pas accessible en écriture"
                ];
            }

            $dest_path = $uploadFileDir . $newFileName;

            if (!@move_uploaded_file($fileTmpPath, $dest_path)) {
                return [
                    "success" => false,
                    "message" => "Erreur lors du déplacement du fichier téléchargé"
                ];
            }

            $photoUrl = '/movie/public/uploads/avatars/' . $newFileName;
        }

        $success = $this->userRepository->updateProfile($userId, $username, $email, $photoUrl, $passwordHash);

        if ($success) {
            $_SESSION['user']['nom_utilisateur'] = $username;
            $_SESSION['user']['email'] = $email;
            $_SESSION['user']['url_photo_profil'] = $photoUrl;
            return [
                "success" => true,
                "message" => "Profil mis à jour avec succès",
                "user" => $_SESSION['user']
            ];
        } else {
            return [
                "success" => false,
                "message" => "Erreur lors de la mise à jour du profil"
            ];
        }
    }
    public function deleteAccount(): array
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['user'])) {
            return ["success" => false, "message" => "Non authentifié"];
        }

        $userId = $_SESSION['user']['id'];

        // Confirmation par mot de passe (sécurité)
        $password = $_POST['mot_de_passe_confirmation'] ?? '';

        if (empty($password)) {
            return ["success" => false, "message" => "Mot de passe requis pour supprimer le compte"];
        }

        $user = $this->userRepository->findByEmail($_SESSION['user']['email']);

        if (!$user || !password_verify($password, $user->getPasswordHash())) {
            return ["success" => false, "message" => "Mot de passe incorrect"];
        }

        // Suppression logique ou physique ?
        $success = $this->userRepository->deleteUser($userId);

        if ($success) {
            // Déconnexion forcée
            session_destroy();
            return [
                "success" => true,
                "message" => "Compte supprimé avec succès",
                "redirect" => "index.php?action=login"
            ];
        }

        return ["success" => false, "message" => "Erreur lors de la suppression"];
    }

}

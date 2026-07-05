<?php

require_once (__DIR__ . '/../core/Database.php');
require_once (__DIR__ . '/../entities/Utilisateur.php');
class UserRepository {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getPdo();
    }

    public function createUser(Utilisateur $user): bool {

        try {

            $stmt = $this->pdo->prepare(
                "INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe_hash) VALUES (:nom_utilisateur, :email, :mot_de_passe_hash)"
            );

            return $stmt->execute([
                "nom_utilisateur" => $user->getNomUtilisateur(),
                "email" => $user->getEmail(),
                "mot_de_passe_hash" => $user->getPasswordHash(),
            ]);

        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error creation: " . $e->getMessage());
            return false;
        }

    }

    /**
     * Verifie si un email existe dans la base de donne
     *
     * @param string $email
     * @return bool true si trouve sinon false
     */
    public function emailExists(string $email) : bool {

        try {

            $stmt = $this->pdo->prepare(
                "SELECT COUNT(*) FROM utilisateurs WHERE BINARY email = :email"
            );

            $stmt->execute([
                "email" => $email
            ]);

            return(int) $stmt->fetchColumn() > 0;

        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error find email: " . $e->getMessage());
            return false;
        }

    }

    /**
     * Recherche un utilisateur par son e-mail (Sensible à la casse)
     *
     * @param string $email
     * @return Utilisateur|null L'objet Utilisateur si trouvé, sinon null
     */
    public function findByEmail(string $email): ?Utilisateur {

        try {

            $stmt = $this->pdo->prepare("SELECT * FROM utilisateurs WHERE BINARY email = :email");
            $stmt->execute(['email' => $email]);

            $row = $stmt->fetch();

            if (!$row) return null;

            $user = new Utilisateur($row['nom_utilisateur'], $row['email'], $row['mot_de_passe_hash'], $row['url_photo_profil']);
            $user->setId($row['id']);
            $user->setRoleUtilisateurs($row['role_utilisateur']);
            $user->setIsActif((bool)$row['is_actif']);

            return $user;

        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error findByEmail: " . $e->getMessage());
            return null;
        }
    }

    public function updateIsActif(int $userId, bool $state_actif): bool {

        try {

            $stmt = $this->pdo->prepare("UPDATE utilisateurs SET is_actif = :state_actif WHERE id = :id");

            // Important : ne pas passer $state_actif dans un tableau execute().
            // PDO convertit alors les bool en string ("" pour false), ce qui
            // peut échouer en mode SQL strict sur une colonne TINYINT/BOOLEAN.
            $stmt->bindValue(':state_actif', $state_actif ? 1 : 0, PDO::PARAM_INT);
            $stmt->bindValue(':id', $userId, PDO::PARAM_INT);

            return $stmt->execute();

        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error update state 'is_actif' in bd: " . $e->getMessage());
            return false;
        }

    }

    public function usernameExists(string $username, int $excludeUserId = 0): bool {
        try {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE BINARY nom_utilisateur = :username AND id != :excludeId");
            $stmt->execute([
                "username" => $username,
                "excludeId" => $excludeUserId
            ]);
            return (int) $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error usernameExists: " . $e->getMessage());
            return false;
        }
    }

    public function emailExistsExclude(string $email, int $excludeUserId): bool {
        try {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE BINARY email = :email AND id != :excludeId");
            $stmt->execute([
                "email" => $email,
                "excludeId" => $excludeUserId
            ]);
            return (int) $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error emailExistsExclude: " . $e->getMessage());
            return false;
        }
    }

    public function updateProfile(int $userId, string $username, string $email, ?string $photoUrl, ?string $passwordHash = null): bool {
        try {
            if ($passwordHash) {
                $stmt = $this->pdo->prepare("UPDATE utilisateurs SET nom_utilisateur = :username, email = :email, url_photo_profil = :photo, mot_de_passe_hash = :password WHERE id = :id");
                return $stmt->execute([
                    "username" => $username,
                    "email" => $email,
                    "photo" => $photoUrl,
                    "password" => $passwordHash,
                    "id" => $userId
                ]);
            } else {
                $stmt = $this->pdo->prepare("UPDATE utilisateurs SET nom_utilisateur = :username, email = :email, url_photo_profil = :photo WHERE id = :id");
                return $stmt->execute([
                    "username" => $username,
                    "email" => $email,
                    "photo" => $photoUrl,
                    "id" => $userId
                ]);
            }
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error updateProfile: " . $e->getMessage());
            return false;
        }
    }

    public function deleteUser(int $userId): bool
    {
        try {
            // Suppression des notes laissées par l'utilisateur
            $this->pdo->prepare("DELETE FROM notes_contenus WHERE utilisateur_id = ?")->execute([$userId]);

            return $this->pdo->prepare("DELETE FROM utilisateurs WHERE id = ?")
                ->execute([$userId]);
        } catch (PDOException $e) {
            error_log("Delete user error: " . $e->getMessage());
            return false;
        }
    }

}
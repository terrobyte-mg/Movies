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
            return $stmt->execute([
                'state_actif' => $state_actif,
                "id" => $userId
            ]);

        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error update state 'is_actif' in bd: " . $e->getMessage());
            return false;
        }

    }

}
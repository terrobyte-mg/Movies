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
                "INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe_hash, date_naisssance_utilisateur) VALUES (:nom_utilisateur, :email, :mot_de_passe_hash, :date_naissance_utilisateur)"
            );

            return $stmt->execute([
                "nom_utilisateur" => $user->getNomUtilisateur(),
                "email" => $user->getEmail(),
                "mot_de_passe_hash" => $user->getPasswordHash(),
                "date_naissance_utilisateur" => $user->getDateNaissance()->format('Y-m-d')
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

            $user = new Utilisateur($row['nom_utilisateur'], $row['email'], $row['mot_de_passe_hash'], $row['url_photo_profil'], new DateTime($row['date_naisssance_utilisateur']));
            $user->setId($row['id']);
            $user->setRoleUtilisateurs($row['role_utilisateur']);
            $user->setIsActif((bool)$row['is_actif']);
            $user->setEstSuspendue((bool)($row['est_suspendue'] ?? false));
            $user->setOnboardingComplete((bool)($row['onboarding_complete'] ?? false));

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

    /**
     * Liste complète des utilisateurs pour le panneau admin.
     * Ne renvoie jamais le hash du mot de passe.
     */
    public function listAllUsers(): array
    {
        try {
            $stmt = $this->pdo->query(
                "SELECT id, nom_utilisateur, email, role_utilisateur, is_actif, est_suspendue, date_creation, url_photo_profil
                 FROM utilisateurs
                 ORDER BY date_creation DESC"
            );
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error listAllUsers: " . $e->getMessage());
            return [];
        }
    }

    public function countUsers(): int
    {
        try {
            return (int) $this->pdo->query("SELECT COUNT(*) FROM utilisateurs")->fetchColumn();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error countUsers: " . $e->getMessage());
            return 0;
        }
    }

    public function countSuspended(): int
    {
        try {
            return (int) $this->pdo->query("SELECT COUNT(*) FROM utilisateurs WHERE est_suspendue = 1")->fetchColumn();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error countSuspended: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Suspend ou réactive un compte (décision admin).
     * Distinct de is_actif, qui reflète juste une session active.
     */
    public function setSuspension(int $userId, bool $suspendu): bool
    {
        try {
            $stmt = $this->pdo->prepare("UPDATE utilisateurs SET est_suspendue = :suspendu WHERE id = :id");
            $stmt->bindValue(':suspendu', $suspendu ? 1 : 0, PDO::PARAM_INT);
            $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error setSuspension: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Marque l'onboarding (choix des genres préférés) comme terminé
     * pour un utilisateur donné.
     */
    public function markOnboardingComplete(int $userId): bool {
        try {
            $stmt = $this->pdo->prepare("UPDATE utilisateurs SET onboarding_complete = 1 WHERE id = :id");
            $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error markOnboardingComplete: " . $e->getMessage());
            return false;
        }
    }

    public function findRoleById(int $userId): ?string
    {
        try {
            $stmt = $this->pdo->prepare("SELECT role_utilisateur FROM utilisateurs WHERE id = :id");
            $stmt->execute(['id' => $userId]);
            $role = $stmt->fetchColumn();
            return $role !== false ? $role : null;
        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error findRoleById: " . $e->getMessage());
            return null;
        }
    }

}
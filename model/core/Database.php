<?php

class Database{

    private static ?Database $instance = null;
    private PDO $pdo;

    private function __construct() {

        $host = "127.0.0.1";
        $user = "root";
        $password = "";
        $database = "Movies";

        try {

            $this->pdo = new PDO(
                "mysql:host=$host;dbname=$database;charset=utf8mb4",
                $user,
                $password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );

        } catch (PDOException $e) {
            error_log("[" . date('d-M-Y H-i-s') . "] Error connexion: " . $e->getMessage());
            die("Erreur : Impossible de se connecter à la base de données.\n");
        }

    }

    public static function getInstance() : Database {
        if (!isset(self::$instance)) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getPdo() : PDO {
        return $this->pdo;
    }

    private function __clone() {}

    public function __wakeup() {}

}

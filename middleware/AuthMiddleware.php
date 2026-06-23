<?php


class AuthMiddleware {

    public static function handle(): ?array
    {

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['user'])) {
            return [
                "success" => false,
                "message" => "Accès refusé, connexion requise",
                "redirect" => "index.php?action=login"
            ];
        }

        return null;
    }
}
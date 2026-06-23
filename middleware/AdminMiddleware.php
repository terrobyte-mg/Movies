<?php


class AdminMiddleware {

    public static function handle(): ?array
    {

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
            return [
                "success" => false,
                "message" => "Accès admin refusé",
                "redirect" => "index.php?action=home"
            ];
        }

        return null;
    }
}
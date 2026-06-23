<?php


class GuestMiddleware {

    public static function handle(): ?array
    {

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (isset($_SESSION['user'])) {
            return [
                "success" => true,
                "redirect" => "index.php?action=home"
            ];
        }

        return null;
    }
}
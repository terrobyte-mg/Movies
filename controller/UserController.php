<?php


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
}
<?php

require_once __DIR__ . '/../model/core/Database.php';

require_once __DIR__ . '/../model/entities/Utilisateur.php';

require_once __DIR__ . '/../model/repository/UserRepository.php';

require_once __DIR__ . '/../controller/AuthController.php';
require_once __DIR__ . '/../controller/UserController.php';

require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/ApiMiddleware.php';
require_once __DIR__ . '/../middleware/GuestMiddleware.php';

session_start();

$action = $_GET['action'] ?? 'home';

$authController = new AuthController();
$userController = new UserController();

switch ($action) {

    case 'signup':

        if ($error = GuestMiddleware::handle()) {
            header("Location: " . $error['redirect']);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            ApiMiddleware::handle();
            echo json_encode($authController->signup());
        } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
            require __DIR__ . '/../view/auth/signup.html';
        }

        break;

    case 'login':

        if ($error = GuestMiddleware::handle()) {
            header("Location: " . $error['redirect']);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            ApiMiddleware::handle();
            echo json_encode($authController->login());
        } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
            require __DIR__ . '/../view/auth/login.html';
        }

        break;

    case 'logout':

        if ($error = AuthMiddleware::handle()) {
            header("Location: " . $error['redirect']);
            exit;
        }
        ApiMiddleware::handle();
        echo json_encode($authController->logout());

        break;

    case 'home':

        if ($error = AuthMiddleware::handle()) {
            header("Location: " . $error['redirect']);
            exit;
        }

        require __DIR__ . '/../view/utilisateur/index.html';
        break;

    case 'parameter':

        if ($error = AuthMiddleware::handle()) {
            header("Location: " . $error['redirect']);
            exit;
        }

        require __DIR__ . '/../view/utilisateur/parametres.html';
        break;

    case 'user':

        if ($error = AuthMiddleware::handle()) {
            echo json_encode($error);
            exit;
        }

        ApiMiddleware::handle();
        echo json_encode($userController->getCurrentUser());
        break;


    default:
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Page introuvable"
        ]);
        break;
}
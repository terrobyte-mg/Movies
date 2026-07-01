<?php

require_once __DIR__ . '/../model/core/Database.php';

require_once __DIR__ . '/../model/entities/Utilisateur.php';
require_once __DIR__ . '/../model/entities/Film.php';

require_once __DIR__ . '/../model/repository/UserRepository.php';
require_once __DIR__ . '/../model/repository/FilmRepository.php';

require_once __DIR__ . '/../controller/AuthController.php';
require_once __DIR__ . '/../controller/UserController.php';
require_once __DIR__ . '/../controller/FilmController.php';

require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../middleware/ApiMiddleware.php';
require_once __DIR__ . '/../middleware/GuestMiddleware.php';

session_start();

$action = $_GET['action'] ?? 'home';

$authController = new AuthController();
$userController = new UserController();

switch ($action) {

    case 'signup':


        if ($error = GuestMiddleware::handle()) {
            require __DIR__ . '/../view/utilisateur/index.html';
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
            require __DIR__ . '/../view/utilisateur/index.html';
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
            require __DIR__ . '/../view/public/index.html';
            exit;
        }
        ApiMiddleware::handle();
        echo json_encode($authController->logout());

        break;

    case 'home':

        if ($error = AuthMiddleware::handle()) {
            require __DIR__ . '/../view/public/index.html';
            exit;
        }

        require __DIR__ . '/../view/utilisateur/index.html';
        break;


    // ==========================================
    // Routes Admin (protégées par AdminMiddleware)
    // ==========================================

    case 'admin':

        if ($error = AuthMiddleware::handle()) {
            require __DIR__ . '/../view/public/index.html';
            exit;
        }
        if ($error = AdminMiddleware::handle()) {
            require __DIR__ . '/../view/utilisateur/index.html';
            exit;
        }

        require __DIR__ . '/../view/admin/index.html';
        break;

    case 'admin-films':

        if ($error = AuthMiddleware::handle()) {
            require __DIR__ . '/../view/public/index.html';
            exit;
        }
        if ($error = AdminMiddleware::handle()) {
            require __DIR__ . '/../view/utilisateur/index.html';
            exit;
        }

        require __DIR__ . '/../view/admin/films.html';
        break;

    case 'admin-utilisateurs':

        if ($error = AuthMiddleware::handle()) {
            require __DIR__ . '/../view/public/index.html';
            exit;
        }
        if ($error = AdminMiddleware::handle()) {
            require __DIR__ . '/../view/utilisateur/index.html';
            exit;
        }

        require __DIR__ . '/../view/admin/utilisateurs.html';
        break;

    case 'admin-profil':

        if ($error = AuthMiddleware::handle()) {
            require __DIR__ . '/../view/public/index.html';
            exit;
        }
        if ($error = AdminMiddleware::handle()) {
            require __DIR__ . '/../view/utilisateur/index.html';
            exit;
        }

        require __DIR__ . '/../view/admin/profil.html';
        break;

    case 'genre':

        if ($error = AuthMiddleware::handle()) {
            require __DIR__ . '/../view/public/index.html';
            exit;
        }

        require __DIR__ . '/../view/utilisateur/par-genre.html';
        break;

    case 'categorie':

        if ($error = AuthMiddleware::handle()) {
            require __DIR__ . '/../view/public/index.html';
            exit;
        }

        require __DIR__ . '/../view/utilisateur/par-categorie.html';
        break;

    case 'date':

        if ($error = AuthMiddleware::handle()) {
            require __DIR__ . '/../view/public/index.html';
            exit;
        }

        require __DIR__ . '/../view/utilisateur/par-date.html';
        break;

    case 'parameter':

        if ($error = AuthMiddleware::handle()) {
            require __DIR__ . '/../view/public/index.html';
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

    case 'update-profile':

        if ($error = AuthMiddleware::handle()) {
            ApiMiddleware::handle();
            echo json_encode($error);
            exit;
        }

        ApiMiddleware::handle();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode([
                "success" => false,
                "message" => "Méthode non autorisée"
            ]);
            exit;
        }

        echo json_encode($userController->updateProfile());
        break;

    case 'delete-account':
        if ($error = AuthMiddleware::handle()) {
            echo json_encode($error);
            exit;
        }
        ApiMiddleware::handle();
        echo json_encode($userController->deleteAccount());
        break;

    default:
        header('location: /movie/public/index.php?action=home');
        exit();
}

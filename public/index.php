<?php

use Random\RandomException;

require_once __DIR__ . '/../model/core/Database.php';
require_once __DIR__ . '/../model/core/ApiResponse.php';

require_once __DIR__ . '/../model/entities/Utilisateur.php';
require_once __DIR__ . '/../model/entities/Film.php';

require_once __DIR__ . '/../model/repository/UserRepository.php';
require_once __DIR__ . '/../model/repository/FilmRepository.php';

require_once __DIR__ . '/../controller/AuthController.php';
require_once __DIR__ . '/../controller/UserController.php';
require_once __DIR__ . '/../controller/FilmController.php';
require_once __DIR__ . '/../controller/AdminController.php';
require_once __DIR__ . '/../controller/OnboardingController.php';

require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../middleware/GuestMiddleware.php';

session_start();

$action = $_GET['action'] ?? 'home';

$authController = new AuthController();
$userController = new UserController();
$filmController = new FilmController();
$adminController = new AdminController();
$onboardingController = new OnboardingController();

// ==========================================
// Helpers de garde (évitent la répétition
// du même bloc if/require/exit partout)
// ==========================================

function requireAuthView(): void
{
    if (AuthMiddleware::handle()) {
        require __DIR__ . '/../view/public/index.html';
        exit;
    }

    // Première connexion : on redirige vers l'onboarding tant que
    // l'utilisateur (non-admin) n'a pas choisi ses genres préférés.
    $role = $_SESSION['user']['role'] ?? null;
    $onboardingComplete = $_SESSION['user']['onboarding_complete'] ?? false;

    if ($role !== 'admin' && !$onboardingComplete) {
        header('location: /movie/public/index.php?action=onboarding');
        exit;
    }
}

/**
 * Garde dédiée à la vue d'onboarding : authentification requise,
 * mais SANS vérifier l'onboarding lui-même (sinon boucle infinie).
 */
function requireAuthOnly(): void
{
    if (AuthMiddleware::handle()) {
        require __DIR__ . '/../view/public/index.html';
        exit;
    }
}

function requireAdminView(): void
{
    if (AdminMiddleware::handle()) {
        require __DIR__ . '/../view/utilisateur/index.html';
        exit;
    }
}

function requireGuestView(): void
{
    if (GuestMiddleware::handle()) {
        require __DIR__ . '/../view/utilisateur/index.html';
        exit;
    }
}

function requireAuthApi(): void
{
    if ($error = AuthMiddleware::handle()) {
        ApiResponse::error($error['message'], 401);
        exit;
    }
}

function requireAdminApi(): void
{
    if ($error = AdminMiddleware::handle()) {
        ApiResponse::error($error['message'], 403);
        exit;
    }
}

function getIdParam(): int
{
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        ApiResponse::error("Identifiant invalide");
        exit;
    }
    return $id;
}

switch ($action) {

    // ==========================================
    // Auth
    // ==========================================

    case 'signup':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            ApiResponse::send($authController->signup());
        } else {
            requireGuestView();
            require __DIR__ . '/../view/auth/signup.html';
        }
        break;

    case 'login':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            ApiResponse::send($authController->login(), 200, 401);
        } else {
            requireGuestView();
            require __DIR__ . '/../view/auth/login.html';
        }
        break;

    case 'onboarding':
        requireAuthOnly();
        require __DIR__ . '/../view/onboarding/onboarding.html';
        break;

    case 'admin-login':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            ApiResponse::send($authController->login_admin(), 200, 401);
        } else {
            requireGuestView();
            require __DIR__ . '/../view/admin/login.html';
        }
        break;

    case 'logout':
        requireAuthApi();
        ApiResponse::send($authController->logout());
        break;

    // ==========================================
    // Pages utilisateur
    // ==========================================

    case 'home':
        requireAuthView();
        require __DIR__ . '/../view/utilisateur/index.html';
        break;

    case 'genre':
        requireAuthView();
        require __DIR__ . '/../view/utilisateur/par-genre.html';
        break;

    case 'categorie':
        requireAuthView();
        require __DIR__ . '/../view/utilisateur/par-categorie.html';
        break;

    case 'date':
        requireAuthView();
        require __DIR__ . '/../view/utilisateur/par-date.html';
        break;

    case 'parameter':
        requireAuthView();
        require __DIR__ . '/../view/utilisateur/parametres.html';
        break;

    case 'voir-film':
        requireAuthView();
        require __DIR__ . '/../view/utilisateur/film.html';
        break;

    // ==========================================
    // Pages admin
    // ==========================================

    case 'admin':
        requireAuthView();
        requireAdminView();
        require __DIR__ . '/../view/admin/index.html';
        break;

    case 'admin-films':
        requireAuthView();
        requireAdminView();
        require __DIR__ . '/../view/admin/films.html';
        break;

    case 'admin-film-edit':
        requireAuthView();
        requireAdminView();
        require __DIR__ . '/../view/admin/film-edit.html';
        break;

    case 'admin-utilisateurs':
        requireAuthView();
        requireAdminView();
        require __DIR__ . '/../view/admin/utilisateurs.html';
        break;

    case 'admin-profil':
        requireAuthView();
        requireAdminView();
        require __DIR__ . '/../view/admin/profil.html';
        break;

    // ==========================================
    // API utilisateur
    // ==========================================

    case 'user':
        requireAuthApi();
        ApiResponse::send($userController->getCurrentUser());
        break;

    case 'update-profile':
        requireAuthApi();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            ApiResponse::error("Méthode non autorisée", 405);
            exit;
        }
        try {
            ApiResponse::send($userController->updateProfile());
        } catch (RandomException $e) {
            error_log("RandomException: ".$e->getMessage());
        }
        break;

    case 'delete-account':
        requireAuthApi();
        ApiResponse::send($userController->deleteAccount());
        break;

    // ==========================================
    // API onboarding (choix des genres préférés)
    // ==========================================

    case 'onboarding-genres':
        requireAuthApi();
        ApiResponse::send($onboardingController->genres());
        break;

    case 'onboarding-submit':
        requireAuthApi();
        ApiResponse::send($onboardingController->submit());
        break;

    case 'onboarding-skip':
        requireAuthApi();
        ApiResponse::send($onboardingController->skip());
        break;

    // ==========================================
    // API films
    // ==========================================

    case 'films':
        requireAuthApi();
        ApiResponse::send($filmController->index());
        break;

    case 'film':
        requireAuthApi();
        $id = getIdParam();
        ApiResponse::send($filmController->show($id), 200, 404);
        break;

    case 'admin-film':
        requireAuthApi();
        requireAdminApi();
        $id = getIdParam();
        ApiResponse::send($filmController->adminShow($id), 200, 404);
        break;

    case 'genres':
        requireAuthApi();
        requireAdminApi();
        ApiResponse::send($filmController->genres());
        break;

    case 'film-create':
        requireAuthApi();
        requireAdminApi();
        ApiResponse::send($filmController->store());
        break;

    case 'film-update':
        requireAuthApi();
        requireAdminApi();
        $id = getIdParam();
        ApiResponse::send($filmController->update($id));
        break;

    case 'film-delete':
        requireAuthApi();
        requireAdminApi();
        $id = getIdParam();
        ApiResponse::send($filmController->delete($id));
        break;

    case 'film-rate':
        requireAuthApi();
        $id = getIdParam();
        ApiResponse::send($filmController->rate($id));
        break;

    case 'get-film-rate':
        requireAuthApi();
        $id = getIdParam();
        ApiResponse::send($filmController->getRate($id));
        break;

    case 'film-favori-toggle':
        requireAuthApi();
        $id = getIdParam();
        ApiResponse::send($filmController->toggleFavori($id));
        break;

    case 'mes-favoris':
        requireAuthApi();
        ApiResponse::send($filmController->myFavoris());
        break;

    case 'film-comments':
        requireAuthApi();
        $id = getIdParam();
        ApiResponse::send($filmController->comments($id));
        break;

    case 'film-comment-add':
        requireAuthApi();
        $id = getIdParam();
        ApiResponse::send($filmController->addComment($id));
        break;

    case 'film-comment-delete':
        requireAuthApi();
        $id = getIdParam();
        ApiResponse::send($filmController->deleteComment($id));
        break;

    // ==========================================
    // API dashboard admin
    // ==========================================

    case 'admin-dashboard-data':
        requireAuthApi();
        requireAdminApi();
        ApiResponse::send($adminController->dashboard());
        break;

    // ==========================================
    // API gestion des utilisateurs (admin)
    // ==========================================

    case 'admin-users-list':
        requireAuthApi();
        requireAdminApi();
        ApiResponse::send($userController->listUsers());
        break;

    case 'admin-user-suspend':
        requireAuthApi();
        requireAdminApi();
        $id = getIdParam();
        ApiResponse::send($userController->toggleSuspension($id, true));
        break;

    case 'admin-user-reactivate':
        requireAuthApi();
        requireAdminApi();
        $id = getIdParam();
        ApiResponse::send($userController->toggleSuspension($id, false));
        break;

    case 'admin-user-delete':
        requireAuthApi();
        requireAdminApi();
        $id = getIdParam();
        ApiResponse::send($userController->deleteUser($id));
        break;

    // ==========================================
    // DEFAULT
    // ==========================================

    default:
        header('location: /movie/public/index.php?action=home');
        exit();
}
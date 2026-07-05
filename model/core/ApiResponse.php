<?php

/**
 * Centralise la réponse JSON (code HTTP + enveloppe success/message/data)
 * pour toutes les routes API. Les controllers continuent de retourner
 * de simples tableaux ["success" => bool, "message" => ..., "data" => ...],
 * c'est le routeur qui décide du code HTTP via ApiResponse::send().
 */
class ApiResponse
{
    public static function success($data = null, string $message = "", int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');

        $payload = ["success" => true];
        if ($message !== "") {
            $payload["message"] = $message;
        }
        if ($data !== null) {
            $payload["data"] = $data;
        }

        echo json_encode($payload);
    }

    public static function error(string $message, int $code = 400, array $extra = []): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode(array_merge(
            ["success" => false, "message" => $message],
            $extra
        ));
    }

    /**
     * Envoie directement le résultat d'un controller (tableau success/message/...)
     * en choisissant le bon code HTTP selon le cas success/échec.
     *
     * @param array $result Résultat du controller
     * @param int $successCode Code HTTP si success = true
     * @param int $errorCode Code HTTP si success = false
     */
    public static function send(array $result, int $successCode = 200, int $errorCode = 400): void
    {
        $success = $result['success'] ?? false;
        $message = $result['message'] ?? '';

        // Le controller peut garder ses clés existantes (redirect, user, film_id...)
        // on les propage telles quelles pour ne pas casser le front existant.
        $extra = $result;
        unset($extra['success'], $extra['message']);

        if ($success) {
            http_response_code($successCode);
        } else {
            http_response_code($errorCode);
        }

        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array_merge(
            ["success" => $success, "message" => $message],
            $extra
        ));
    }
}
<?php


class ApiMiddleware {

    public static function handle(): void
    {
        header('Content-Type: application/json; charset=utf-8');
    }
}
<?php
/**
 * SavePoint - Proxy IGDB / Twitch API
 * Substitui o Supabase Edge Function com backend PHP local
 */

require_once __DIR__ . '/config.php';

// Obtém ação e query do POST ou GET
$data = getRequestData();
$action = $_GET['action'] ?? ($data['action'] ?? 'top');
$query = $_GET['query'] ?? ($data['query'] ?? '');

$twitchClientId = 'gtl8h2stm1mbfzxmqsk69k2wh7t3oc';
$twitchClientSecret = 't0fx62cauw3m9rfi0t788d759pz32j';

/**
 * Obtém o token da Twitch OAuth com cache em disco para evitar requisições repetidas
 */
function getTwitchAccessToken(string $clientId, string $clientSecret): ?string {
    $cacheFile = sys_get_temp_dir() . '/savepoint_twitch_token.json';

    if (file_exists($cacheFile)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if (isset($cached['token'], $cached['expires_at']) && time() < ($cached['expires_at'] - 60)) {
            return $cached['token'];
        }
    }

    $tokenUrl = "https://id.twitch.tv/oauth2/token?client_id={$clientId}&client_secret={$clientSecret}&grant_type=client_credentials";

    $ch = curl_init($tokenUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return null;
    }

    $data = json_decode($response, true);
    if (!isset($data['access_token'])) {
        return null;
    }

    $expiresIn = (int)($data['expires_in'] ?? 3600);
    @file_put_contents($cacheFile, json_encode([
        'token' => $data['access_token'],
        'expires_at' => time() + $expiresIn
    ]));

    return $data['access_token'];
}

$token = getTwitchAccessToken($twitchClientId, $twitchClientSecret);

if (!$token) {
    // Se a Twitch falhar (ex: sem conexão com internet), retorna resposta vazia
    jsonResponse([], 200);
}

// Monta a consulta de acordo com a ação solicitada
$bodyStr = '';
if ($action === 'search') {
    // Escapa aspas para evitar quebra na query IGDB
    $cleanQuery = str_replace('"', '\"', $query);
    $bodyStr = "search \"{$cleanQuery}\"; fields name, cover.url, genres.name, platforms.name, first_release_date, summary; limit 12;";
} else {
    // Top games / destaques
    $bodyStr = "fields name, cover.url, genres.name, platforms.name, first_release_date, summary; sort rating desc; where rating_count > 1000 & cover != null; limit 15;";
}

$igdbUrl = 'https://api.igdb.com/v4/games';
$ch = curl_init($igdbUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyStr);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 8);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Client-ID: ' . $twitchClientId,
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || !$response) {
    jsonResponse([], 200);
}

$gamesData = json_decode($response, true);
jsonResponse(is_array($gamesData) ? $gamesData : []);


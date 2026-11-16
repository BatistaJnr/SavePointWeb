<?php
/**
 * SavePoint - Configuração Geral e Conexão de Banco de Dados
 * Backend Local em PHP 8+ com PDO (MySQL com fallback automático para SQLite)
 */

// Inicialização de Sessão Segura
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_samesite', 'Lax');
    session_start();
}

// Configurações de Cabeçalhos CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: {$origin}");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Trata requisição de preflight OPTIONS
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Credenciais padrão do MySQL (XAMPP padrão: 127.0.0.1, root, sem senha)
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'savepoint_db');

/**
 * Retorna uma conexão PDO ativa.
 * Tenta MySQL primeiro. Se o MySQL estiver desligado, utiliza SQLite como fallback transparente.
 */
function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    // 1. Tentar conectar ao MySQL
    try {
        $dsnWithoutDb = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
        $rawPdo = new PDO($dsnWithoutDb, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 1
        ]);

        // Garante que o banco de dados exista
        $rawPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $rawPdo->exec("USE `" . DB_NAME . "`");
        $pdo = $rawPdo;

        // Cria tabelas no MySQL se não existirem
        setupMySQLTables($pdo);
        return $pdo;
    } catch (PDOException $e) {
        // MySQL indisponível, faz fallback para SQLite
        error_log("MySQL não disponível. Usando SQLite fallback.");
    }

    // 2. Conectar via SQLite (Garante funcionamento mesmo sem XAMPP MySQL ligado)
    $dbDir = __DIR__ . '/../database';
    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0777, true);
    }
    $sqlitePath = $dbDir . '/savepoint.sqlite';

    $pdo = new PDO("sqlite:" . $sqlitePath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    $pdo->exec("PRAGMA foreign_keys = ON;");

    setupSQLiteTables($pdo);
    return $pdo;
}

/**
 * Criação e verificação automática das tabelas MySQL
 */
function setupMySQLTables(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `email` VARCHAR(191) NOT NULL UNIQUE,
            `password` VARCHAR(255) NOT NULL,
            `bio` TEXT DEFAULT NULL,
            `avatar_url` TEXT DEFAULT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `game_logs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `game_id` INT NOT NULL,
            `game_title` VARCHAR(255) NOT NULL,
            `status` ENUM('jogando', 'concluido', 'backlog', 'abandonado') NOT NULL DEFAULT 'jogando',
            `rating` TINYINT UNSIGNED DEFAULT NULL,
            `review` TEXT DEFAULT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_user_logs` (`user_id`),
            INDEX `idx_game_logs` (`game_id`),
            CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `custom_lists` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `name` VARCHAR(150) NOT NULL,
            `description` TEXT DEFAULT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_user_lists` (`user_id`),
            CONSTRAINT `fk_lists_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `custom_list_items` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `list_id` INT NOT NULL,
            `game_id` INT NOT NULL,
            `game_title` VARCHAR(255) NOT NULL,
            `game_cover` TEXT DEFAULT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_list_items` (`list_id`),
            CONSTRAINT `fk_items_list` FOREIGN KEY (`list_id`) REFERENCES `custom_lists` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    seedInitialDataIfEmpty($pdo);
}

/**
 * Criação e verificação automática das tabelas SQLite
 */
function setupSQLiteTables(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(191) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            bio TEXT DEFAULT NULL,
            avatar_url TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS game_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            game_id INTEGER NOT NULL,
            game_title VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'jogando',
            rating INTEGER DEFAULT NULL,
            review TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS custom_lists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name VARCHAR(150) NOT NULL,
            description TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS custom_list_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            list_id INTEGER NOT NULL,
            game_id INTEGER NOT NULL,
            game_title VARCHAR(255) NOT NULL,
            game_cover TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (list_id) REFERENCES custom_lists(id) ON DELETE CASCADE
        );
    ");

    seedInitialDataIfEmpty($pdo);
}

/**
 * Popula usuário e análises de exemplo caso o banco de dados esteja vazio
 */
function seedInitialDataIfEmpty(PDO $pdo): void {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = (int)($stmt->fetch()['count'] ?? 0);
    if ($userCount === 0) {
        $passwordHash = password_hash('123456', PASSWORD_DEFAULT);
        $insertUser = $pdo->prepare("
            INSERT INTO users (id, name, email, password, bio, avatar_url)
            VALUES (1, 'Arthur Gamer', 'arthur@savepoint.com', ?, 'Explorando mundos fantásticos e zerando RPGs clássicos desde 1998.', 'https://api.dicebear.com/7.x/bottts/svg?seed=RetroGamer')
        ");
        $insertUser->execute([$passwordHash]);
    }

    $stmtLogs = $pdo->query("SELECT COUNT(*) as count FROM game_logs");
    $logCount = (int)($stmtLogs->fetch()['count'] ?? 0);
    if ($logCount === 0) {
        $insertLog = $pdo->prepare("
            INSERT INTO game_logs (user_id, game_id, game_title, status, rating, review)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $insertLog->execute([1, 119171, "Baldur's Gate III", 'concluido', 10, 'Uma obra-prima incontestável dos RPGs eletrônicos. Narrativa e liberdade impressionantes!']);
        $insertLog->execute([1, 1942, "The Witcher 3: Wild Hunt", 'concluido', 10, 'A trilha sonora e as missões secundárias definiram o padrão para os jogos de mundo aberto.']);
        $insertLog->execute([1, 119133, "Elden Ring", 'jogando', 9, 'Desafiador e fascinante. O design de mundo das Terras Intermédias é sublime.']);
    }

    $stmtList = $pdo->query("SELECT COUNT(*) as count FROM custom_lists");
    $listCount = (int)($stmtList->fetch()['count'] ?? 0);
    if ($listCount === 0) {
        $insertList = $pdo->prepare("
            INSERT INTO custom_lists (id, user_id, name, description)
            VALUES (1, 1, 'Top RPGs Inesquecíveis', 'Os jogos que mais marcaram minha jornada gamer.')
        ");
        $insertList->execute();
    }

    $stmtItems = $pdo->query("SELECT COUNT(*) as count FROM custom_list_items");
    $itemCount = (int)($stmtItems->fetch()['count'] ?? 0);
    if ($itemCount === 0) {
        $insertItem = $pdo->prepare("
            INSERT INTO custom_list_items (list_id, game_id, game_title, game_cover)
            VALUES (?, ?, ?, ?)
        ");
        $insertItem->execute([1, 119171, "Baldur's Gate III", "https://images.igdb.com/igdb/image/upload/t_cover_big/co670h.jpg"]);
        $insertItem->execute([1, 1942, "The Witcher 3: Wild Hunt", "https://images.igdb.com/igdb/image/upload/t_cover_big/coaarl.jpg"]);
    }
}

/**
 * Resposta formatada em JSON com status HTTP
 */
function jsonResponse($data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Obtém dados do corpo da requisição (JSON ou formulário POST) com cache estático
 */
/**
 * Obtém dados do corpo da requisição (JSON ou formulário POST) com cache estático e proteção UTF-8
 */
function getRequestData(): array {
    static $cachedData = null;
    if ($cachedData !== null) {
        return $cachedData;
    }

    $raw = file_get_contents('php://input');
    $rawTrimmed = trim($raw);
    if (!empty($rawTrimmed)) {
        // Garante codificação UTF-8 válida caso o cliente envie em Latin1/Windows-1252
        if (!mb_check_encoding($rawTrimmed, 'UTF-8')) {
            $rawTrimmed = mb_convert_encoding($rawTrimmed, 'UTF-8', 'ISO-8859-1');
        }
        $json = json_decode($rawTrimmed, true);
        if (is_array($json)) {
            $cachedData = array_merge($_POST, $json);
            return $cachedData;
        }
    }
    $cachedData = $_POST;
    return $cachedData;
}

/**
 * Retorna o ID do usuário atualmente autenticado ou null
 */
function getCurrentUserId(): ?int {
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

/**
 * Obriga que a requisição seja feita por um usuário logado
 */
function requireAuth(): int {
    $userId = getCurrentUserId();
    if (!$userId) {
        jsonResponse([
            'success' => false,
            'error' => 'Você precisa estar logado para realizar esta ação.'
        ], 401);
    }
    return $userId;
}

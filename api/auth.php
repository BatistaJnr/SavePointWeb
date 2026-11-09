<?php
/**
 * SavePoint - Autenticação de Usuários (Login, Cadastro, Sessão e Logout)
 * Backend PHP 8+ com Sessions e Hash Seguro
 */

require_once __DIR__ . '/config.php';

$data = getRequestData();
$action = $_GET['action'] ?? ($data['action'] ?? '');
$db = getDB();

// ----------------------------------------------------
// 1. CHECAGEM DE SESSÃO ATIVA (ME / GET SESSION)
// ----------------------------------------------------
if ($action === 'session' || $action === 'me' || ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($action))) {
    $userId = getCurrentUserId();
    if (!$userId) {
        jsonResponse([
            'authenticated' => false,
            'user' => null
        ]);
    }

    $stmt = $db->prepare("SELECT id, name, email, bio, avatar_url, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        // Usuário pode ter sido removido do banco
        session_unset();
        session_destroy();
        jsonResponse([
            'authenticated' => false,
            'user' => null
        ]);
    }

    jsonResponse([
        'authenticated' => true,
        'user' => $user
    ]);
}

// ----------------------------------------------------
// 2. CADASTRO DE NOVO USUÁRIO (REGISTER)
// ----------------------------------------------------
if ($action === 'register') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'error' => 'Método inválido.'], 405);
    }

    $data = getRequestData();
    $name = trim($data['name'] ?? '');
    $email = trim(strtolower($data['email'] ?? ''));
    $password = $data['password'] ?? '';

    if (empty($name) || strlen($name) < 2) {
        jsonResponse(['success' => false, 'error' => 'Por favor, informe um nome válido (mínimo 2 caracteres).'], 400);
    }

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'error' => 'Por favor, informe um e-mail válido.'], 400);
    }

    if (empty($password) || strlen($password) < 6) {
        jsonResponse(['success' => false, 'error' => 'A senha deve conter no mínimo 6 caracteres.'], 400);
    }

    // Verifica se e-mail já existe
    $stmtCheck = $db->prepare("SELECT id FROM users WHERE LOWER(email) = ?");
    $stmtCheck->execute([$email]);
    if ($stmtCheck->fetch()) {
        jsonResponse(['success' => false, 'error' => 'Este e-mail já está cadastrado no sistema.'], 409);
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $defaultAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=" . urlencode($name);

    $stmtInsert = $db->prepare("
        INSERT INTO users (name, email, password, bio, avatar_url)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmtInsert->execute([$name, $email, $hashedPassword, '', $defaultAvatar]);

    $newUserId = (int)$db->lastInsertId();
    $_SESSION['user_id'] = $newUserId;

    jsonResponse([
        'success' => true,
        'message' => 'Conta criada com sucesso!',
        'user' => [
            'id' => $newUserId,
            'name' => $name,
            'email' => $email,
            'bio' => '',
            'avatar_url' => $defaultAvatar
        ]
    ], 201);
}

// ----------------------------------------------------
// 3. LOGIN DE USUÁRIO (LOGIN)
// ----------------------------------------------------
if ($action === 'login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['success' => false, 'error' => 'Método inválido.'], 405);
    }

    $data = getRequestData();
    $email = trim(strtolower($data['email'] ?? ''));
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'error' => 'Informe o e-mail e a senha.'], 400);
    }

    $stmt = $db->prepare("SELECT id, name, email, password, bio, avatar_url FROM users WHERE LOWER(email) = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        jsonResponse(['success' => false, 'error' => 'E-mail ou senha inválidos.'], 401);
    }

    $_SESSION['user_id'] = (int)$user['id'];

    unset($user['password']);
    jsonResponse([
        'success' => true,
        'message' => 'Login realizado com sucesso!',
        'user' => $user
    ]);
}

// ----------------------------------------------------
// 4. LOGOUT (SAIR DA CONTA)
// ----------------------------------------------------
if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();

    jsonResponse([
        'success' => true,
        'message' => 'Você saiu da sua conta com sucesso.'
    ]);
}

jsonResponse(['error' => 'Ação não reconhecida.'], 400);

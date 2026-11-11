<?php
/**
 * SavePoint - Gerenciamento de Logs de Jogos (Backlog, Histórico e Avaliações)
 * Backend PHP 8+ com PDO
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$data = getRequestData();
$action = $_GET['action'] ?? ($data['action'] ?? '');
$db = getDB();

// ----------------------------------------------------
// 1. CONSULTAS (GET)
// ----------------------------------------------------
if ($method === 'GET') {
    // 1.1 Atividades Recentes (Dashboard)
    if ($action === 'recent') {
        $stmt = $db->query("
            SELECT l.id, l.user_id, l.game_id, l.game_title, l.status, l.rating, l.review, l.created_at,
                   u.name as user_name, u.avatar_url as user_avatar
            FROM game_logs l
            JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
            LIMIT 15
        ");
        $logs = $stmt->fetchAll();

        // Formata compatível com o frontend existente (log.profiles.name)
        foreach ($logs as &$log) {
            $log['profiles'] = [
                'name' => $log['user_name'],
                'avatar_url' => $log['user_avatar']
            ];
            if ($log['rating'] !== null) {
                $log['rating'] = (int)$log['rating'];
            }
        }
        jsonResponse(['success' => true, 'data' => $logs]);
    }

    // 1.2 Análises de um Jogo Específico
    if ($action === 'game') {
        $gameId = (int)($_GET['game_id'] ?? 0);
        if (!$gameId) {
            jsonResponse(['success' => false, 'error' => 'ID do jogo não informado.'], 400);
        }

        $stmt = $db->prepare("
            SELECT l.id, l.user_id, l.game_id, l.game_title, l.status, l.rating, l.review, l.created_at,
                   u.name as user_name, u.avatar_url as user_avatar
            FROM game_logs l
            JOIN users u ON l.user_id = u.id
            WHERE l.game_id = ? AND l.review IS NOT NULL AND TRIM(l.review) != ''
            ORDER BY l.created_at DESC
        ");
        $stmt->execute([$gameId]);
        $reviews = $stmt->fetchAll();

        foreach ($reviews as &$r) {
            $r['profiles'] = [
                'name' => $r['user_name'],
                'avatar_url' => $r['user_avatar']
            ];
            if ($r['rating'] !== null) {
                $r['rating'] = (int)$r['rating'];
            }
        }
        jsonResponse(['success' => true, 'data' => $reviews]);
    }

    // 1.3 Histórico de Jogos do Usuário Logado
    if ($action === 'user' || empty($action)) {
        $userId = requireAuth();
        $stmt = $db->prepare("
            SELECT id, user_id, game_id, game_title, status, rating, review, created_at, updated_at
            FROM game_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
        $userLogs = $stmt->fetchAll();

        foreach ($userLogs as &$ul) {
            if ($ul['rating'] !== null) {
                $ul['rating'] = (int)$ul['rating'];
            }
        }
        jsonResponse(['success' => true, 'data' => $userLogs]);
    }

    jsonResponse(['success' => false, 'error' => 'Ação não reconhecida.'], 400);
}

// ----------------------------------------------------
// 2. EXCLUSÃO DE LOG (DELETE ou POST com action=delete)
// ----------------------------------------------------
if ($method === 'DELETE' || ($method === 'POST' && $action === 'delete')) {
    $userId = requireAuth();
    $data = getRequestData();
    $logId = (int)($_GET['id'] ?? ($data['id'] ?? 0));

    if (!$logId) {
        jsonResponse(['success' => false, 'error' => 'ID do registro não informado.'], 400);
    }

    $stmt = $db->prepare("DELETE FROM game_logs WHERE id = ? AND user_id = ?");
    $stmt->execute([$logId, $userId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['success' => false, 'error' => 'Registro não encontrado ou você não tem permissão para excluí-lo.'], 404);
    }

    jsonResponse(['success' => true, 'message' => 'Jogo removido com sucesso!']);
}

// ----------------------------------------------------
// 3. ATUALIZAÇÃO DE LOG (PUT ou POST com action=update)
// ----------------------------------------------------
if ($method === 'PUT' || ($method === 'POST' && $action === 'update')) {
    $userId = requireAuth();
    $data = getRequestData();

    $logId = (int)($data['id'] ?? ($_GET['id'] ?? 0));
    $status = trim($data['status'] ?? 'jogando');
    $rating = isset($data['rating']) && $data['rating'] !== '' && $data['rating'] !== null ? (int)$data['rating'] : null;
    $review = isset($data['review']) && trim($data['review']) !== '' ? trim($data['review']) : null;

    if (!$logId) {
        jsonResponse(['success' => false, 'error' => 'ID do registro não informado.'], 400);
    }

    $validStatuses = ['jogando', 'concluido', 'backlog', 'abandonado'];
    if (!in_array($status, $validStatuses, true)) {
        $status = 'jogando';
    }

    if ($rating !== null && ($rating < 0 || $rating > 10)) {
        jsonResponse(['success' => false, 'error' => 'A nota deve estar entre 0 e 10.'], 400);
    }

    $stmt = $db->prepare("
        UPDATE game_logs 
        SET status = ?, rating = ?, review = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$status, $rating, $review, $logId, $userId]);

    if ($stmt->rowCount() === 0) {
        // Verifica se o registro existe
        $check = $db->prepare("SELECT id FROM game_logs WHERE id = ? AND user_id = ?");
        $check->execute([$logId, $userId]);
        if (!$check->fetch()) {
            jsonResponse(['success' => false, 'error' => 'Registro não encontrado.'], 404);
        }
    }

    jsonResponse([
        'success' => true,
        'message' => 'Registro atualizado com sucesso!',
        'data' => [
            'id' => $logId,
            'status' => $status,
            'rating' => $rating,
            'review' => $review
        ]
    ]);
}

// ----------------------------------------------------
// 4. CRIAÇÃO DE NOVO LOG (POST)
// ----------------------------------------------------
if ($method === 'POST') {
    $userId = requireAuth();
    $data = getRequestData();

    $gameId = (int)($data['game_id'] ?? 0);
    $gameTitle = trim($data['game_title'] ?? '');
    $status = trim($data['status'] ?? 'jogando');
    $rating = isset($data['rating']) && $data['rating'] !== '' && $data['rating'] !== null ? (int)$data['rating'] : null;
    $review = isset($data['review']) && trim($data['review']) !== '' ? trim($data['review']) : null;

    if (!$gameId || empty($gameTitle)) {
        jsonResponse(['success' => false, 'error' => 'Dados do jogo incompletos.'], 400);
    }

    $validStatuses = ['jogando', 'concluido', 'backlog', 'abandonado'];
    if (!in_array($status, $validStatuses, true)) {
        $status = 'jogando';
    }

    if ($rating !== null && ($rating < 0 || $rating > 10)) {
        jsonResponse(['success' => false, 'error' => 'A nota deve estar entre 0 e 10.'], 400);
    }

    $stmt = $db->prepare("
        INSERT INTO game_logs (user_id, game_id, game_title, status, rating, review)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$userId, $gameId, $gameTitle, $status, $rating, $review]);
    $newLogId = (int)$db->lastInsertId();

    jsonResponse([
        'success' => true,
        'message' => 'Jogo adicionado com sucesso ao seu histórico!',
        'data' => [
            'id' => $newLogId,
            'user_id' => $userId,
            'game_id' => $gameId,
            'game_title' => $gameTitle,
            'status' => $status,
            'rating' => $rating,
            'review' => $review
        ]
    ], 201);
}

jsonResponse(['error' => 'Método inválido.'], 405);

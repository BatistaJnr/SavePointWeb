<?php
/**
 * SavePoint - Gerenciamento de Listas Personalizadas e Jogos da Lista
 * Backend PHP 8+ com PDO
 */

require_once __DIR__ . '/config.php';

$userId = requireAuth();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$data = getRequestData();
$action = $_GET['action'] ?? ($data['action'] ?? '');

// ----------------------------------------------------
// 1. CONSULTAS (GET)
// ----------------------------------------------------
if ($method === 'GET') {
    // 1.1 Listar jogos de uma lista específica
    if ($action === 'items') {
        $listId = (int)($_GET['list_id'] ?? 0);
        if (!$listId) {
            jsonResponse(['success' => false, 'error' => 'ID da lista não informado.'], 400);
        }

        // Verifica se a lista pertence ao usuário
        $stmtCheck = $db->prepare("SELECT id, name FROM custom_lists WHERE id = ? AND user_id = ?");
        $stmtCheck->execute([$listId, $userId]);
        $list = $stmtCheck->fetch();
        if (!$list) {
            jsonResponse(['success' => false, 'error' => 'Lista não encontrada.'], 404);
        }

        $stmtItems = $db->prepare("
            SELECT id, list_id, game_id, game_title, game_cover, created_at 
            FROM custom_list_items 
            WHERE list_id = ? 
            ORDER BY created_at DESC
        ");
        $stmtItems->execute([$listId]);
        $items = $stmtItems->fetchAll();

        jsonResponse([
            'success' => true,
            'list' => $list,
            'data' => $items
        ]);
    }

    // 1.2 Listar todas as listas do usuário com contagem de jogos
    $stmt = $db->prepare("
        SELECT l.id, l.name, l.description as `desc`, l.created_at as createdAt,
               COUNT(i.id) as gameCount
        FROM custom_lists l
        LEFT JOIN custom_list_items i ON l.id = i.list_id
        WHERE l.user_id = ?
        GROUP BY l.id
        ORDER BY l.created_at DESC
    ");
    $stmt->execute([$userId]);
    $lists = $stmt->fetchAll();

    foreach ($lists as &$l) {
        $l['gameCount'] = (int)($l['gameCount'] ?? 0);
    }

    jsonResponse(['success' => true, 'data' => $lists]);
}

// ----------------------------------------------------
// 2. EXCLUSÃO DE JOGO DE UMA LISTA (remove_item)
// ----------------------------------------------------
if ($action === 'remove_item') {
    $itemId = (int)($_GET['id'] ?? ($data['id'] ?? ($data['item_id'] ?? 0)));
    if (!$itemId) {
        jsonResponse(['success' => false, 'error' => 'ID do item não informado.'], 400);
    }

    // Remove garantindo que a lista pertença ao usuário logado
    $stmtDel = $db->prepare("
        DELETE FROM custom_list_items 
        WHERE id = ? AND list_id IN (SELECT id FROM custom_lists WHERE user_id = ?)
    ");
    $stmtDel->execute([$itemId, $userId]);

    jsonResponse(['success' => true, 'message' => 'Jogo removido da lista com sucesso!']);
}

// ----------------------------------------------------
// 3. EXCLUSÃO DE LISTA COMPLETA (delete)
// ----------------------------------------------------
if ($method === 'DELETE' || ($method === 'POST' && $action === 'delete')) {
    $listId = (int)($_GET['id'] ?? ($data['id'] ?? 0));

    if (!$listId) {
        jsonResponse(['success' => false, 'error' => 'ID da lista não informado.'], 400);
    }

    $stmt = $db->prepare("DELETE FROM custom_lists WHERE id = ? AND user_id = ?");
    $stmt->execute([$listId, $userId]);

    jsonResponse(['success' => true, 'message' => 'Lista removida com sucesso.']);
}

// ----------------------------------------------------
// 4. ADICIONAR JOGO A UMA LISTA (add_item)
// ----------------------------------------------------
if ($action === 'add_item') {
    $listId = (int)($data['list_id'] ?? ($_GET['list_id'] ?? 0));
    $gameId = (int)($data['game_id'] ?? 0);
    $gameTitle = trim($data['game_title'] ?? '');
    $gameCover = trim($data['game_cover'] ?? '');

    if (!$listId || !$gameId || empty($gameTitle)) {
        jsonResponse(['success' => false, 'error' => 'Dados incompletos para adicionar à lista.'], 400);
    }

    // Verifica permissão na lista
    $checkList = $db->prepare("SELECT id, name FROM custom_lists WHERE id = ? AND user_id = ?");
    $checkList->execute([$listId, $userId]);
    $list = $checkList->fetch();
    if (!$list) {
        jsonResponse(['success' => false, 'error' => 'Lista personalizada não encontrada.'], 404);
    }

    // Evita duplicidade do mesmo jogo na mesma lista
    $checkItem = $db->prepare("SELECT id FROM custom_list_items WHERE list_id = ? AND game_id = ?");
    $checkItem->execute([$listId, $gameId]);
    if ($checkItem->fetch()) {
        jsonResponse(['success' => false, 'error' => "Este jogo já está na lista '{$list['name']}'."], 409);
    }

    $stmtInsert = $db->prepare("
        INSERT INTO custom_list_items (list_id, game_id, game_title, game_cover)
        VALUES (?, ?, ?, ?)
    ");
    $stmtInsert->execute([$listId, $gameId, $gameTitle, $gameCover]);
    $newItemId = (int)$db->lastInsertId();

    jsonResponse([
        'success' => true,
        'message' => "Jogo adicionado com sucesso à lista '{$list['name']}'!",
        'data' => [
            'id' => $newItemId,
            'list_id' => $listId,
            'game_id' => $gameId,
            'game_title' => $gameTitle
        ]
    ], 201);
}

// ----------------------------------------------------
// 5. CRIAR NOVA LISTA (POST sem ação específica)
// ----------------------------------------------------
if ($method === 'POST') {
    $name = trim($data['name'] ?? '');
    $desc = trim($data['desc'] ?? ($data['description'] ?? ''));

    if (empty($name)) {
        jsonResponse(['success' => false, 'error' => 'O nome da lista é obrigatório.'], 400);
    }

    $stmt = $db->prepare("
        INSERT INTO custom_lists (user_id, name, description)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$userId, $name, $desc]);
    $newListId = (int)$db->lastInsertId();

    jsonResponse([
        'success' => true,
        'message' => 'Lista criada com sucesso!',
        'data' => [
            'id' => $newListId,
            'name' => $name,
            'desc' => $desc,
            'gameCount' => 0,
            'createdAt' => date('Y-m-d H:i:s')
        ]
    ], 201);
}

jsonResponse(['error' => 'Método não suportado.'], 405);

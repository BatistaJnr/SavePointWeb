<?php
/**
 * SavePoint - Gerenciamento de Perfil e Upload de Foto
 * Backend PHP 8+ com PDO e Armazenamento Local de Arquivos
 */

require_once __DIR__ . '/config.php';

$userId = requireAuth();
$db = getDB();

// ----------------------------------------------------
// 1. CONSULTA DE PERFIL (GET)
// ----------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare("SELECT id, name, email, bio, avatar_url, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['success' => false, 'error' => 'Usuário não encontrado.'], 404);
    }

    jsonResponse(['success' => true, 'profile' => $user]);
}

// ----------------------------------------------------
// 2. ATUALIZAÇÃO DE PERFIL E AVATAR (POST)
// ----------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getRequestData();

    $name = trim($data['name'] ?? '');
    $bio = trim($data['bio'] ?? '');
    $incomingAvatar = trim($data['avatar_url'] ?? ($data['avatar'] ?? ''));

    if (empty($name)) {
        jsonResponse(['success' => false, 'error' => 'O nome de exibição é obrigatório.'], 400);
    }

    // Busca dados atuais do usuário
    $stmtCurrent = $db->prepare("SELECT avatar_url FROM users WHERE id = ?");
    $stmtCurrent->execute([$userId]);
    $currentUser = $stmtCurrent->fetch();
    $avatarUrl = $currentUser['avatar_url'] ?? '';

    $uploadDir = __DIR__ . '/../uploads/avatars';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Caso A: Arquivo enviado via formulário tradicional ($_FILES)
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['avatar'];
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);

        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif'
        ];

        if (!isset($allowedMimes[$mime])) {
            jsonResponse(['success' => false, 'error' => 'Formato de imagem não suportado. Use JPG, PNG, WebP ou GIF.'], 400);
        }

        $ext = $allowedMimes[$mime];
        $filename = "avatar_{$userId}_" . time() . "_{$ext}";
        $targetPath = $uploadDir . '/' . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $avatarUrl = 'uploads/avatars/' . $filename;
        }
    }
    // Caso B: Imagem enviada em Base64 pelo Canvas
    elseif (!empty($incomingAvatar) && preg_match('/^data:image\/(\w+);base64,/', $incomingAvatar, $matches)) {
        $type = strtolower($matches[1]);
        $base64Data = substr($incomingAvatar, strpos($incomingAvatar, ',') + 1);
        $decoded = base64_decode($base64Data);

        if ($decoded !== false) {
            $ext = ($type === 'png' || $type === 'webp' || $type === 'gif') ? $type : 'jpg';
            $filename = "avatar_{$userId}_" . time() . ".{$ext}";
            $targetPath = $uploadDir . '/' . $filename;

            if (file_put_contents($targetPath, $decoded) !== false) {
                $avatarUrl = 'uploads/avatars/' . $filename;
            }
        }
    }
    // Caso C: URL externa ou predefinição (ex: Dicebear)
    elseif (!empty($incomingAvatar)) {
        $avatarUrl = $incomingAvatar;
    }

    // Salva alterações no banco de dados
    $stmtUpdate = $db->prepare("
        UPDATE users 
        SET name = ?, bio = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ");
    $stmtUpdate->execute([$name, $bio, $avatarUrl, $userId]);

    // Retorna perfil atualizado
    $stmtGet = $db->prepare("SELECT id, name, email, bio, avatar_url, created_at FROM users WHERE id = ?");
    $stmtGet->execute([$userId]);
    $updatedUser = $stmtGet->fetch();

    jsonResponse([
        'success' => true,
        'message' => 'Perfil atualizado com sucesso!',
        'profile' => $updatedUser
    ]);
}

jsonResponse(['error' => 'Método inválido.'], 405);


<?php
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Validar token
$headers = getallheaders();
$token = '';
if (isset($headers['Authorization'])) {
    $token = str_replace('Bearer ', '', $headers['Authorization']);
} elseif (isset($headers['authorization'])) {
    $token = str_replace('Bearer ', '', $headers['authorization']);
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token no proporcionado']);
    exit;
}

$userQuery = "SELECT id FROM usuarios WHERE token = ? AND activo = 1";
$userStmt = $db->prepare($userQuery);
$userStmt->execute([$token]);

if ($userStmt->rowCount() === 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token inválido']);
    exit;
}

$query = "SELECT id, codigo, nombre, stock, stock_minimo 
          FROM productos 
          WHERE stock <= stock_minimo AND activo = 1 
          ORDER BY stock ASC";
$stmt = $db->prepare($query);
$stmt->execute();

$alerts = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $alerts[] = $row;
}

http_response_code(200);
echo json_encode($alerts);
?>
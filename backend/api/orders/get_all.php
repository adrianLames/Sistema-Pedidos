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

$query = "SELECT p.id, p.codigo_pedido, p.recepcionista_id, p.bodeguero_id, p.estado, 
                 p.fecha_creacion, p.fecha_actualizacion, p.observaciones, p.tiempo_preparacion, p.fecha_entrega,
                 u.nombre as recepcionista_nombre,
                 (SELECT COUNT(*) FROM detalle_pedidos dp WHERE dp.pedido_id = p.id) as cantidad_items
          FROM pedidos p
          LEFT JOIN usuarios u ON p.recepcionista_id = u.id
          ORDER BY p.fecha_creacion DESC";
$stmt = $db->prepare($query);
$stmt->execute();

$orders = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $orders[] = $row;
}

http_response_code(200);
echo json_encode($orders);
?>
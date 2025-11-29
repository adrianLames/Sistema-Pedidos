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

$order_id = isset($_GET['order_id']) ? $_GET['order_id'] : '';

if (!empty($order_id)) {
    // Obtener datos generales del pedido (incluyendo tiempo_preparacion)
    $pedidoQuery = "SELECT * FROM pedidos WHERE id = ?";
    $pedidoStmt = $db->prepare($pedidoQuery);
    $pedidoStmt->execute([$order_id]);
    $pedido = $pedidoStmt->fetch(PDO::FETCH_ASSOC);

    $query = "SELECT dp.id, dp.producto_id, dp.cantidad, dp.precio_unitario,
                     p.codigo, p.nombre, p.descripcion
              FROM detalle_pedidos dp
              JOIN productos p ON dp.producto_id = p.id
              WHERE dp.pedido_id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$order_id]);
    
    $details = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $details[] = $row;
    }
    
    http_response_code(200);
    echo json_encode([
        'pedido' => $pedido,
        'detalles' => $details
    ]);
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de pedido no proporcionado']);
}
?>
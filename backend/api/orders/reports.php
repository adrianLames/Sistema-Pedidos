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

$fecha_inicio = isset($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : date('Y-m-01');
$fecha_fin = isset($_GET['fecha_fin']) ? $_GET['fecha_fin'] : date('Y-m-d');

$query = "SELECT p.codigo_pedido, p.fecha_creacion, p.estado,
                 u.nombre as recepcionista_nombre,
                 COUNT(dp.id) as total_items,
                 SUM(dp.cantidad * dp.precio_unitario) as total_valor
          FROM pedidos p
          LEFT JOIN usuarios u ON p.recepcionista_id = u.id
          LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
          WHERE p.fecha_creacion BETWEEN ? AND ?
          GROUP BY p.id
          ORDER BY p.fecha_creacion DESC";
$stmt = $db->prepare($query);
$stmt->execute([$fecha_inicio, $fecha_fin . ' 23:59:59']);

$reports = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $reports[] = $row;
}

http_response_code(200);
echo json_encode($reports);
?>
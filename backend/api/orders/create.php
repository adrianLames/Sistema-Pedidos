<?php
include_once '../config/database.php';
// Incluir helper de notificaciones admin
include_once '../admin/notif_helper.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token no proporcionado']);
    exit;
}

$userQuery = "SELECT id FROM usuarios WHERE token = ?";
$userStmt = $db->prepare($userQuery);
$userStmt->execute([$token]);
$user = $userStmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token inválido']);
    exit;
}

$recepcionista_id = $user['id'];

$tiempo_preparacion = isset($data->tiempo_preparacion) ? intval($data->tiempo_preparacion) : null;
$fecha_entrega = isset($data->fecha_entrega) && $data->fecha_entrega !== '' ? $data->fecha_entrega : null;

if (!empty($data->detalles) && is_array($data->detalles) && count($data->detalles) > 0) {
    try {
        $db->beginTransaction();
        
        $codigo_pedido = 'PED' . date('Ymd') . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
        
        $orderQuery = "INSERT INTO pedidos (codigo_pedido, recepcionista_id, observaciones, tiempo_preparacion, fecha_entrega) VALUES (?, ?, ?, ?, ?)";
        $orderStmt = $db->prepare($orderQuery);
        $orderStmt->execute([$codigo_pedido, $recepcionista_id, $data->observaciones ?? '', $tiempo_preparacion, $fecha_entrega]);
        $pedido_id = $db->lastInsertId();
        
        $detailQuery = "INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)";
        $detailStmt = $db->prepare($detailQuery);
        
        foreach ($data->detalles as $detalle) {
            $detailStmt->execute([
                $pedido_id,
                $detalle->producto_id,
                $detalle->cantidad,
                $detalle->precio_unitario
            ]);
            // Descontar stock del producto al crear el pedido
            $updateStockQuery = "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?";
            $updateStockStmt = $db->prepare($updateStockQuery);
            $updateStockStmt->execute([
                $detalle->cantidad,
                $detalle->producto_id,
                $detalle->cantidad
            ]);
            // Notificar admin si no hay stock suficiente
            if ($updateStockStmt->rowCount() === 0) {
                $prodStmt = $db->prepare("SELECT nombre, stock, stock_minimo FROM productos WHERE id = ?");
                $prodStmt->execute([$detalle->producto_id]);
                $prod = $prodStmt->fetch(PDO::FETCH_ASSOC);
                if ($prod) {
                    crearNotificacionAdminStock([$prod], $db);
                }
                throw new Exception('Stock insuficiente para el producto ID ' . $detalle->producto_id);
            }
        }
        
        $db->commit();
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Pedido creado correctamente',
            'codigo_pedido' => $codigo_pedido,
            'pedido_id' => $pedido_id
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(503);
        echo json_encode(['success' => false, 'message' => 'Error al crear pedido: ' . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No hay productos en el pedido']);
}
?>
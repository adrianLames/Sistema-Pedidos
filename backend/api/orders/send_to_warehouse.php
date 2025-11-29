<?php
include_once '../config/database.php';
include_once '../admin/notif_helper.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->pedido_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de pedido no proporcionado']);
    exit;
}

$pedido_id = $data->pedido_id;

try {
    $db->beginTransaction();
    // Obtener los detalles del pedido
    $query = "SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$pedido_id]);
    $detalles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$detalles) {
        throw new Exception('No se encontraron detalles para el pedido');
    }

    foreach ($detalles as $detalle) {
        // Descontar stock del producto
        $updateStockQuery = "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?";
        $updateStockStmt = $db->prepare($updateStockQuery);
        $updateStockStmt->execute([
            $detalle['cantidad'],
            $detalle['producto_id'],
            $detalle['cantidad']
        ]);
        // Notificar admin si no hay stock suficiente
        if ($updateStockStmt->rowCount() === 0) {
            $prodStmt = $db->prepare("SELECT nombre, stock, stock_minimo FROM productos WHERE id = ?");
            $prodStmt->execute([$detalle['producto_id']]);
            $prod = $prodStmt->fetch(PDO::FETCH_ASSOC);
            if ($prod) {
                crearNotificacionAdminStock([$prod], $db);
            }
            throw new Exception('Stock insuficiente para el producto ID ' . $detalle['producto_id']);
        }
    }

    // Cambiar estado del pedido a "enviado a bodega" (opcional, si tienes un campo de estado)
    // $db->prepare("UPDATE pedidos SET estado = 'enviado_bodega' WHERE id = ?")->execute([$pedido_id]);

    $db->commit();
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Stock descontado y pedido enviado a bodega']);
} catch (Exception $e) {
    $db->rollBack();
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

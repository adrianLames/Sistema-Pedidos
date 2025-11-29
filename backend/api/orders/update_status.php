<?php
include_once '../config/database.php';
// Incluir helper de notificaciones admin
include_once '../admin/notif_helper.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->pedido_id) && !empty($data->estado)) {
    // Si el nuevo estado es 'preparacion', descontar stock
    if ($data->estado === 'preparacion') {
        // Obtener detalles del pedido
        $queryDetalles = "SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = ?";
        $stmtDetalles = $db->prepare($queryDetalles);
        $stmtDetalles->execute([$data->pedido_id]);
        $detalles = $stmtDetalles->fetchAll(PDO::FETCH_ASSOC);
        $productos_stock_bajo = [];
        foreach ($detalles as $detalle) {
            $updateStockQuery = "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?";
            $updateStockStmt = $db->prepare($updateStockQuery);
            $updateStockStmt->execute([
                $detalle['cantidad'],
                $detalle['producto_id'],
                $detalle['cantidad']
            ]);
            if ($updateStockStmt->rowCount() === 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Stock insuficiente para el producto ID ' . $detalle['producto_id']]);
                exit;
            }
            // Verificar si el producto quedó en stock mínimo o por debajo
            $checkStockQuery = "SELECT nombre, stock, stock_minimo FROM productos WHERE id = ?";
            $checkStockStmt = $db->prepare($checkStockQuery);
            $checkStockStmt->execute([$detalle['producto_id']]);
            $prod = $checkStockStmt->fetch(PDO::FETCH_ASSOC);
            if ($prod && $prod['stock'] <= $prod['stock_minimo']) {
                $productos_stock_bajo[] = [
                    'nombre' => $prod['nombre'],
                    'stock' => $prod['stock'],
                    'stock_minimo' => $prod['stock_minimo']
                ];
            }
        }
        // Notificación admin si hay productos en stock bajo
        if (count($productos_stock_bajo) > 0) {
            crearNotificacionAdminStock($productos_stock_bajo, $db);
        }
    }
    $query = "UPDATE pedidos SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?";
    $stmt = $db->prepare($query);
    if ($stmt->execute([$data->estado, $data->pedido_id])) {
        $response = ['success' => true, 'message' => 'Estado actualizado correctamente'];
        if (isset($productos_stock_bajo) && count($productos_stock_bajo) > 0) {
            $response['stock_alerta'] = $productos_stock_bajo;
        }
        echo json_encode($response);
    } else {
        http_response_code(503);
        echo json_encode(['success' => false, 'message' => 'Error al actualizar estado']);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
}
?>
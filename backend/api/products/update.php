<?php
// Mostrar errores para depuración temporal
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once '../config/database.php';
// Incluir helper de notificaciones admin
include_once '../admin/notif_helper.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $updateFields = [];
    $params = [];
    
    if (!empty($data->codigo)) {
        $updateFields[] = "codigo = ?";
        $params[] = $data->codigo;
    }
    
    if (!empty($data->nombre)) {
        $updateFields[] = "nombre = ?";
        $params[] = $data->nombre;
    }
    
    if (isset($data->descripcion)) {
        $updateFields[] = "descripcion = ?";
        $params[] = $data->descripcion;
    }
    
    if (isset($data->precio)) {
        $updateFields[] = "precio = ?";
        $params[] = $data->precio;
    }
    
    if (isset($data->stock)) {
        $updateFields[] = "stock = ?";
        $params[] = $data->stock;
    }
    
    if (isset($data->stock_minimo)) {
        $updateFields[] = "stock_minimo = ?";
        $params[] = $data->stock_minimo;
    }
    
    if (count($updateFields) > 0) {
        $params[] = $data->id;
        $query = "UPDATE productos SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute($params)) {
            // Verificar stock bajo o sin stock y notificar admin
            if (isset($data->stock)) {
                $checkQuery = "SELECT nombre, stock, stock_minimo FROM productos WHERE id = ?";
                $checkStmt = $db->prepare($checkQuery);
                $checkStmt->execute([$data->id]);
                $prod = $checkStmt->fetch(PDO::FETCH_ASSOC);
                if ($prod && $prod['stock'] <= $prod['stock_minimo']) {
                    // Corregir: pasar $db como segundo argumento
                    crearNotificacionAdminStock([$prod], $db);
                }
            }
            echo json_encode(['success' => true, 'message' => 'Producto actualizado correctamente']);
        } else {
            http_response_code(503);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar producto']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No hay datos para actualizar']);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de producto no proporcionado']);
}
?>
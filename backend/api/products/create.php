<?php
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->codigo) && !empty($data->nombre) && isset($data->precio) && isset($data->stock)) {
    $checkQuery = "SELECT id FROM productos WHERE codigo = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$data->codigo]);
    
    if ($checkStmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'El código ya existe']);
        exit;
    }
    
    $query = "INSERT INTO productos (codigo, nombre, descripcion, precio, stock, stock_minimo) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $db->prepare($query);
    
    $stock_minimo = !empty($data->stock_minimo) ? $data->stock_minimo : 5;
    
    if ($stmt->execute([
        $data->codigo, 
        $data->nombre, 
        $data->descripcion ?? '', 
        $data->precio, 
        $data->stock, 
        $stock_minimo
    ])) {
        http_response_code(201);
        echo json_encode([
            'success' => true, 
            'message' => 'Producto creado correctamente',
            'id' => $db->lastInsertId()
        ]);
    } else {
        http_response_code(503);
        echo json_encode(['success' => false, 'message' => 'Error al crear producto']);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
}
?>
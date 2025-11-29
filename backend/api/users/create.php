<?php
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->nombre) && !empty($data->email) && !empty($data->password) && !empty($data->rol)) {
    $checkQuery = "SELECT id FROM usuarios WHERE email = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$data->email]);
    
    if ($checkStmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'El email ya está registrado']);
        exit;
    }
    
    $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
    
    $query = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute([$data->nombre, $data->email, $hashed_password, $data->rol])) {
        http_response_code(201);
        echo json_encode([
            'success' => true, 
            'message' => 'Usuario creado correctamente',
            'id' => $db->lastInsertId()
        ]);
    } else {
        http_response_code(503);
        echo json_encode(['success' => false, 'message' => 'Error al crear usuario']);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
}
?>
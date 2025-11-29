<?php
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $updateFields = [];
    $params = [];
    
    if (!empty($data->nombre)) {
        $updateFields[] = "nombre = ?";
        $params[] = $data->nombre;
    }
    
    if (!empty($data->email)) {
        $updateFields[] = "email = ?";
        $params[] = $data->email;
    }
    
    if (!empty($data->password)) {
        $updateFields[] = "password = ?";
        $params[] = password_hash($data->password, PASSWORD_DEFAULT);
    }
    
    if (!empty($data->rol)) {
        $updateFields[] = "rol = ?";
        $params[] = $data->rol;
    }
    
    if (isset($data->activo)) {
        $updateFields[] = "activo = ?";
        $params[] = $data->activo;
    }
    
    if (count($updateFields) > 0) {
        $params[] = $data->id;
        $query = "UPDATE usuarios SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute($params)) {
            echo json_encode(['success' => true, 'message' => 'Usuario actualizado correctamente']);
        } else {
            http_response_code(503);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar usuario']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No hay datos para actualizar']);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de usuario no proporcionado']);
}
?>
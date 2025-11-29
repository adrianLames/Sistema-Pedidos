<?php
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$headers = getallheaders();
$token = '';
if (isset($headers['Authorization'])) {
    $token = str_replace('Bearer ', '', $headers['Authorization']);
} elseif (isset($headers['authorization'])) {
    $token = str_replace('Bearer ', '', $headers['authorization']);
} elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
}

if (!empty($token)) {
    $query = "SELECT id, nombre, email, rol FROM usuarios WHERE token = ? AND activo = 1";
    $stmt = $db->prepare($query);
    $stmt->execute([$token]);
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($user);
    } else {
        http_response_code(401);
        echo json_encode(['message' => 'Token inválido']);
    }
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Token no proporcionado']);
}
?>
<?php
require_once '../config/database.php';
header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

// Validar token para todas las operaciones
$headers = getallheaders();
$token = null;

if (isset($headers['Authorization'])) {
    $authHeader = $headers['Authorization'];
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
    }
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Token no proporcionado']);
    exit;
}

// Validar que el usuario existe y tiene el token
$query = "SELECT id, rol FROM usuarios WHERE token = :token AND activo = 1 LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':token', $token);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Token inválido']);
    exit;
}

// Solo admin puede ver las notificaciones admin
if ($user['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Obtener notificaciones
    $sql = "SELECT * FROM notificaciones_admin ORDER BY leida ASC, fecha_creacion DESC LIMIT 50";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $notificaciones = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $notificaciones[] = $row;
    }
    echo json_encode($notificaciones);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $tipo = $data['tipo'] ?? 'general';
    $mensaje = $data['mensaje'] ?? '';
    $link_accion = $data['link_accion'] ?? null;
    
    $sql = "INSERT INTO notificaciones_admin (tipo, mensaje, link_accion) VALUES (?, ?, ?)";
    $stmt = $db->prepare($sql);
    
    if ($stmt->execute([$tipo, $mensaje, $link_accion])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Error al crear notificación']);
    }
    exit;
}

if ($method === 'PUT') {
    // Marcar como leída
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id > 0) {
        $sql = "UPDATE notificaciones_admin SET leida = 1 WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'ID inválido']);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'Método no soportado']);

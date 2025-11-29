<?php
require_once '../config/database.php';
header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

// Validar token
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

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Activar logs de errores para debugging
    error_log("POST reportes.php - Iniciando...");
    
    $data = json_decode(file_get_contents('php://input'), true);
    error_log("POST reportes.php - Datos recibidos: " . json_encode($data));
    
    $pedido_id = intval($data['pedido_id'] ?? 0);
    $usuario_id = intval($data['usuario_id'] ?? 0);
    $tipo = $data['tipo'] ?? 'otro';
    $mensaje = $data['mensaje'] ?? '';
    $recepcionista_id = intval($data['recepcionista_id'] ?? 0);
    
    error_log("POST reportes.php - Procesando: pedido_id=$pedido_id, usuario_id=$usuario_id, tipo=$tipo, recepcionista_id=$recepcionista_id");
    
    if ($pedido_id > 0 && $usuario_id > 0 && $tipo) {
        try {
            // Insertar el reporte
            $sql = "INSERT INTO reportes_pedidos (pedido_id, usuario_id, tipo, mensaje, recepcionista_id) VALUES (?, ?, ?, ?, ?)";
            $stmt = $db->prepare($sql);
            
            if ($stmt->execute([$pedido_id, $usuario_id, $tipo, $mensaje, $recepcionista_id])) {
                $reporteId = $db->lastInsertId();
                error_log("POST reportes.php - Reporte insertado con ID: $reporteId");
                
                // Notificar admin
                $notifMsg = "Reporte de pedido #$pedido_id: $tipo" . ($mensaje ? " - $mensaje" : "");
                $link = "/admin/pedidos/$pedido_id";
                
                $sqlNotif = "INSERT INTO notificaciones_admin (tipo, mensaje, link_accion) VALUES (?, ?, ?)";
                $stmtNotif = $db->prepare($sqlNotif);
                $stmtNotif->execute(['reporte', $notifMsg, $link]);
                
                $notifId = $db->lastInsertId();
                error_log("POST reportes.php - Notificación insertada con ID: $notifId");
                
                echo json_encode(['success' => true, 'reporte_id' => $reporteId, 'notif_id' => $notifId]);
            } else {
                error_log("POST reportes.php - Error al ejecutar INSERT de reporte");
                echo json_encode(['success' => false, 'error' => 'Error al crear reporte']);
            }
        } catch (Exception $e) {
            error_log("POST reportes.php - Exception: " . $e->getMessage());
            echo json_encode(['success' => false, 'error' => 'Excepción: ' . $e->getMessage()]);
        }
    } else {
        error_log("POST reportes.php - Datos incompletos: pedido_id=$pedido_id, usuario_id=$usuario_id, tipo=$tipo");
        echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    }
    exit;
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id > 0) {
        $sql = "UPDATE reportes_pedidos SET leida = 1 WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'ID inválido']);
    }
    exit;
}

if ($method === 'GET') {
    $pedido_id = intval($_GET['pedido_id'] ?? 0);
    $recepcionista_id = intval($_GET['recepcionista_id'] ?? 0);
    $bodeguero_id = intval($_GET['bodeguero_id'] ?? 0);
    
    if ($pedido_id > 0) {
        $sql = "SELECT r.*, u.nombre as usuario_nombre, u.rol, p.codigo_pedido as numero_pedido
                FROM reportes_pedidos r 
                JOIN usuarios u ON r.usuario_id = u.id 
                LEFT JOIN pedidos p ON r.pedido_id = p.id
                WHERE r.pedido_id = ? 
                ORDER BY r.fecha_reporte DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute([$pedido_id]);
    } elseif ($recepcionista_id > 0) {
        $sql = "SELECT r.*, u.nombre as usuario_nombre, u.rol, p.codigo_pedido as numero_pedido
                FROM reportes_pedidos r 
                JOIN usuarios u ON r.usuario_id = u.id 
                LEFT JOIN pedidos p ON r.pedido_id = p.id
                WHERE r.recepcionista_id = ? 
                ORDER BY r.leida ASC, r.fecha_reporte DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute([$recepcionista_id]);
    } elseif ($bodeguero_id > 0) {
        $sql = "SELECT r.*, u.nombre as usuario_nombre, u.rol, p.codigo_pedido as numero_pedido
                FROM reportes_pedidos r 
                JOIN usuarios u ON r.usuario_id = u.id 
                LEFT JOIN pedidos p ON r.pedido_id = p.id
                WHERE r.usuario_id = ? 
                ORDER BY r.leida ASC, r.fecha_reporte DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute([$bodeguero_id]);
    } else {
        $sql = "SELECT r.*, u.nombre as usuario_nombre, u.rol, p.codigo_pedido as numero_pedido
                FROM reportes_pedidos r 
                JOIN usuarios u ON r.usuario_id = u.id 
                LEFT JOIN pedidos p ON r.pedido_id = p.id
                ORDER BY r.leida ASC, r.fecha_reporte DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute();
    }
    
    $reportes = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $reportes[] = $row;
    }
    echo json_encode($reportes);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Método no soportado']);

<?php
// Script de prueba para verificar el endpoint de reportes
require_once __DIR__ . '/../config/database.php';

echo "=== TESTING REPORTES API ===\n\n";

// Simular el login para obtener un token
$database = new Database();
$db = $database->getConnection();

// Buscar usuario recepcionista
$query = "SELECT * FROM usuarios WHERE rol = 'recepcionista' LIMIT 1";
$stmt = $db->prepare($query);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    die("No se encontró usuario recepcionista\n");
}

echo "Usuario encontrado:\n";
echo "ID: " . $user['id'] . "\n";
echo "Nombre: " . $user['nombre_completo'] . "\n";
echo "Username: " . $user['username'] . "\n\n";

// Crear un token simple (en producción usarías JWT)
$token = base64_encode($user['id'] . ':' . $user['username']);
echo "Token generado: Bearer $token\n\n";

// Simular la petición al endpoint
echo "Consultando reportes para recepcionista_id=" . $user['id'] . "\n\n";

$query = "SELECT r.*, 
          p.numero_pedido,
          u.nombre_completo as bodeguero_nombre
          FROM reportes_pedidos r
          LEFT JOIN pedidos p ON r.pedido_id = p.id
          LEFT JOIN usuarios u ON r.bodeguero_id = u.id
          WHERE r.recepcionista_id = :recepcionista_id
          ORDER BY r.fecha_hora DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(':recepcionista_id', $user['id']);
$stmt->execute();

$reportes = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Reportes encontrados: " . count($reportes) . "\n\n";

if (count($reportes) > 0) {
    echo "JSON que debería devolver el endpoint:\n";
    echo json_encode($reportes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} else {
    echo "No hay reportes en la base de datos\n";
}

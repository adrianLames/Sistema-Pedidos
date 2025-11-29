<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== SIMULANDO ENDPOINT /orders/reportes.php ===\n\n";

// Simular parámetro GET
$recepcionista_id = 2;
echo "Consultando reportes para recepcionista_id: $recepcionista_id\n\n";

// Query exacta del endpoint
$sql = "SELECT r.*, u.nombre as usuario_nombre, u.rol 
        FROM reportes_pedidos r 
        JOIN usuarios u ON r.usuario_id = u.id 
        WHERE r.recepcionista_id = ? 
        ORDER BY r.leida ASC, r.fecha_reporte DESC";

echo "SQL Query:\n$sql\n\n";

$stmt = $db->prepare($sql);
$stmt->execute([$recepcionista_id]);

$reportes = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $reportes[] = $row;
}

echo "Reportes encontrados: " . count($reportes) . "\n\n";

if (count($reportes) > 0) {
    echo "JSON Response que debería recibir el frontend:\n";
    echo json_encode($reportes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
} else {
    echo "[] (Array vacío)\n";
}

<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Insertar notificación de prueba para admin
$sql = "INSERT INTO notificaciones_admin (tipo, mensaje, link_accion) VALUES (?, ?, ?)";
$stmt = $db->prepare($sql);

$notificaciones = [
    ['stock', 'Stock bajo detectado en Jabón industrial desengrasante (Stock: 3, Mínimo: 5)', '/admin/productos'],
    ['reporte', 'Reporte de pedido #1: producto dañado - El producto llegó en mal estado', '/admin/pedidos/1'],
    ['general', 'Sistema actualizado correctamente', null]
];

foreach ($notificaciones as $notif) {
    if ($stmt->execute($notif)) {
        echo "✓ Notificación creada: " . $notif[1] . "\n";
    } else {
        echo "✗ Error al crear notificación: " . $notif[1] . "\n";
    }
}

// Verificar notificaciones en la base de datos
echo "\n--- Notificaciones en la base de datos ---\n";
$sql = "SELECT * FROM notificaciones_admin ORDER BY fecha_creacion DESC LIMIT 5";
$stmt = $db->query($sql);
$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $count++;
    echo "$count. [" . $row['tipo'] . "] " . $row['mensaje'] . " (Leída: " . ($row['leida'] ? 'Sí' : 'No') . ")\n";
}

echo "\nTotal de notificaciones no leídas: ";
$sql = "SELECT COUNT(*) as total FROM notificaciones_admin WHERE leida = 0";
$result = $db->query($sql)->fetch(PDO::FETCH_ASSOC);
echo $result['total'] . "\n";
?>

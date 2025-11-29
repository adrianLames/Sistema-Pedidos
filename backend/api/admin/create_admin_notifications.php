<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== CREANDO NOTIFICACIONES PARA ADMIN ===\n\n";

// Verificar que existe admin
$query = "SELECT id, nombre FROM usuarios WHERE rol = 'admin' LIMIT 1";
$stmt = $db->query($query);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin) {
    echo "❌ No hay admin en la base de datos\n";
    exit;
}

echo "✓ Admin encontrado: " . $admin['nombre'] . " (ID: " . $admin['id'] . ")\n\n";

// Limpiar notificaciones antiguas
echo "--- Limpiando notificaciones antiguas ---\n";
$query = "DELETE FROM notificaciones_admin";
$stmt = $db->query($query);
echo "✓ Notificaciones antiguas eliminadas\n\n";

// Crear nuevas notificaciones
echo "--- Creando notificaciones de prueba ---\n";

$notificaciones = [
    [
        'tipo' => 'stock',
        'mensaje' => 'El producto LC-401 tiene stock bajo (2 unidades restantes)',
        'link_accion' => '/admin/productos'
    ],
    [
        'tipo' => 'stock',
        'mensaje' => 'El producto LC-405 está agotado',
        'link_accion' => '/admin/productos'
    ],
    [
        'tipo' => 'sistema',
        'mensaje' => 'Nuevo usuario registrado en el sistema',
        'link_accion' => '/admin/usuarios'
    ]
];

$query = "INSERT INTO notificaciones_admin (tipo, mensaje, link_accion, leida) 
          VALUES (?, ?, ?, 0)";
$stmt = $db->prepare($query);

foreach ($notificaciones as $notif) {
    if ($stmt->execute(array_values($notif))) {
        echo "✓ Notificación creada: [" . $notif['tipo'] . "] " . $notif['mensaje'] . "\n";
    }
}

echo "\n--- Verificando notificaciones creadas ---\n";
$query = "SELECT * FROM notificaciones_admin ORDER BY fecha_creacion DESC";
$stmt = $db->query($query);

$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $count++;
    echo "$count. [" . $row['tipo'] . "] " . $row['mensaje'] . "\n";
    echo "   Leída: " . ($row['leida'] ? 'Sí' : 'No') . " | Fecha: " . $row['fecha_creacion'] . "\n";
}

echo "\n✅ Total de notificaciones para admin: $count\n";
echo "🎉 ¡Listo! El admin debería ver estas notificaciones en su campana.\n";

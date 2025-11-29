<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== CREANDO REPORTES PARA USUARIO ACTUAL ===\n\n";

// El ID del recepcionista actual
$recepcionista_id = 13;

echo "Creando reportes para recepcionista ID: $recepcionista_id\n\n";

// Verificar que el usuario existe
$query = "SELECT * FROM usuarios WHERE id = :id";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $recepcionista_id);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "❌ No existe usuario con ID $recepcionista_id\n";
    exit;
}

echo "✓ Usuario encontrado: " . $user['nombre'] . " (" . $user['rol'] . ")\n\n";

// Obtener el primer pedido
$query = "SELECT id, codigo_pedido FROM pedidos LIMIT 1";
$stmt = $db->query($query);
$pedido = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$pedido) {
    echo "❌ No hay pedidos en la base de datos\n";
    exit;
}

echo "✓ Pedido encontrado: " . $pedido['codigo_pedido'] . " (ID: " . $pedido['id'] . ")\n\n";

// Obtener un bodeguero
$query = "SELECT id FROM usuarios WHERE rol = 'bodeguero' LIMIT 1";
$stmt = $db->query($query);
$bodeguero = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$bodeguero) {
    echo "⚠ No hay bodeguero, creando uno...\n";
    $query = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)";
    $stmt = $db->prepare($query);
    $password = password_hash('password', PASSWORD_DEFAULT);
    $stmt->execute(['Luis Bodeguero', 'bodeguero@test.com', $password, 'bodeguero']);
    $bodeguero_id = $db->lastInsertId();
    echo "✓ Bodeguero creado con ID: $bodeguero_id\n";
} else {
    $bodeguero_id = $bodeguero['id'];
    echo "✓ Bodeguero encontrado con ID: $bodeguero_id\n";
}

echo "\n--- Eliminando reportes antiguos para este recepcionista ---\n";
$query = "DELETE FROM reportes_pedidos WHERE recepcionista_id = ?";
$stmt = $db->prepare($query);
$stmt->execute([$recepcionista_id]);
echo "✓ Reportes antiguos eliminados\n";

echo "\n--- Creando 3 nuevos reportes ---\n";

$reportes = [
    [
        'pedido_id' => $pedido['id'],
        'usuario_id' => $bodeguero_id,
        'tipo' => 'producto_dañado',
        'mensaje' => 'El producto LC-401 llegó con el envase roto',
        'recepcionista_id' => $recepcionista_id
    ],
    [
        'pedido_id' => $pedido['id'],
        'usuario_id' => $bodeguero_id,
        'tipo' => 'falta_producto',
        'mensaje' => 'Falta 1 unidad de LC-403 Limpiador Multiusos',
        'recepcionista_id' => $recepcionista_id
    ],
    [
        'pedido_id' => $pedido['id'],
        'usuario_id' => $bodeguero_id,
        'tipo' => 'otro',
        'mensaje' => 'Cliente solicita cambio de hora de entrega',
        'recepcionista_id' => $recepcionista_id
    ]
];

$query = "INSERT INTO reportes_pedidos (pedido_id, usuario_id, tipo, mensaje, recepcionista_id, leida) 
          VALUES (?, ?, ?, ?, ?, 0)";
$stmt = $db->prepare($query);

foreach ($reportes as $reporte) {
    if ($stmt->execute(array_values($reporte))) {
        echo "✓ Reporte creado: " . $reporte['tipo'] . " - " . $reporte['mensaje'] . "\n";
    }
}

echo "\n--- Verificando reportes creados ---\n";
$query = "SELECT r.*, u.nombre as usuario_nombre, u.rol 
          FROM reportes_pedidos r 
          JOIN usuarios u ON r.usuario_id = u.id 
          WHERE r.recepcionista_id = ?
          ORDER BY r.fecha_reporte DESC";
$stmt = $db->prepare($query);
$stmt->execute([$recepcionista_id]);

$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $count++;
    echo "$count. [" . $row['tipo'] . "] " . $row['mensaje'] . "\n";
    echo "   Por: " . $row['usuario_nombre'] . " | Leída: " . ($row['leida'] ? 'Sí' : 'No') . "\n";
}

echo "\n✅ Total de reportes para recepcionista ID $recepcionista_id: $count\n";
echo "\n🎉 ¡Listo! Recarga la página en el navegador para ver los reportes.\n";

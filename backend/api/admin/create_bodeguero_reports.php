<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== CREANDO REPORTES PARA BODEGUERO ===\n\n";

// Obtener el bodeguero
$query = "SELECT id, nombre FROM usuarios WHERE rol = 'bodeguero' LIMIT 1";
$stmt = $db->query($query);
$bodeguero = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$bodeguero) {
    echo "❌ No hay bodeguero en la base de datos\n";
    exit;
}

echo "✓ Bodeguero encontrado: " . $bodeguero['nombre'] . " (ID: " . $bodeguero['id'] . ")\n\n";

// Obtener un pedido
$query = "SELECT id, codigo_pedido FROM pedidos LIMIT 1";
$stmt = $db->query($query);
$pedido = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$pedido) {
    echo "❌ No hay pedidos en la base de datos\n";
    exit;
}

echo "✓ Pedido encontrado: " . $pedido['codigo_pedido'] . " (ID: " . $pedido['id'] . ")\n\n";

// Obtener un recepcionista
$query = "SELECT id FROM usuarios WHERE rol = 'recepcionista' LIMIT 1";
$stmt = $db->query($query);
$recepcionista = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$recepcionista) {
    echo "❌ No hay recepcionista en la base de datos\n";
    exit;
}

echo "✓ Recepcionista encontrado (ID: " . $recepcionista['id'] . ")\n\n";

// Eliminar reportes antiguos del bodeguero
echo "--- Limpiando reportes antiguos del bodeguero ---\n";
$query = "DELETE FROM reportes_pedidos WHERE usuario_id = ?";
$stmt = $db->prepare($query);
$stmt->execute([$bodeguero['id']]);
echo "✓ Reportes antiguos eliminados\n\n";

// Crear nuevos reportes (estos son reportes CREADOS POR el bodeguero)
echo "--- Creando reportes del bodeguero ---\n";

$reportes = [
    [
        'pedido_id' => $pedido['id'],
        'usuario_id' => $bodeguero['id'],
        'tipo' => 'producto_dañado',
        'mensaje' => 'Producto LC-402 con envase dañado detectado en almacén',
        'recepcionista_id' => $recepcionista['id']
    ],
    [
        'pedido_id' => $pedido['id'],
        'usuario_id' => $bodeguero['id'],
        'tipo' => 'falta_producto',
        'mensaje' => 'Stock insuficiente de LC-404 para completar el pedido',
        'recepcionista_id' => $recepcionista['id']
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
$query = "SELECT r.*, p.codigo_pedido as numero_pedido
          FROM reportes_pedidos r 
          LEFT JOIN pedidos p ON r.pedido_id = p.id
          WHERE r.usuario_id = ?
          ORDER BY r.fecha_reporte DESC";
$stmt = $db->prepare($query);
$stmt->execute([$bodeguero['id']]);

$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $count++;
    echo "$count. [" . $row['tipo'] . "] " . $row['mensaje'] . "\n";
    echo "   Pedido: " . $row['numero_pedido'] . " | Leída: " . ($row['leida'] ? 'Sí' : 'No') . "\n";
}

echo "\n✅ Total de reportes creados por el bodeguero: $count\n";
echo "🎉 ¡Listo! El bodeguero debería ver estos reportes en su campana de notificaciones.\n";

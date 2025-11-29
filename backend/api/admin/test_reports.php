<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Obtener el ID del usuario recepcionista
$sql = "SELECT id, nombre, email FROM usuarios WHERE rol = 'recepcionista' LIMIT 1";
$stmt = $db->query($sql);
$recepcionista = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$recepcionista) {
    echo "❌ No hay usuario recepcionista en la base de datos\n";
    echo "Creando usuario recepcionista de prueba...\n";
    
    $sql = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    $password = password_hash('password', PASSWORD_DEFAULT);
    $stmt->execute(['Julian Recepcionista', 'recepcionista@gmail.com', $password, 'recepcionista']);
    
    $recepcionista_id = $db->lastInsertId();
    echo "✓ Usuario recepcionista creado con ID: $recepcionista_id\n";
} else {
    $recepcionista_id = $recepcionista['id'];
    echo "✓ Usuario recepcionista encontrado: " . $recepcionista['nombre'] . " (ID: $recepcionista_id)\n";
}

// Obtener el ID del primer pedido
$sql = "SELECT id, codigo_pedido FROM pedidos LIMIT 1";
$stmt = $db->query($sql);
$pedido = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$pedido) {
    echo "❌ No hay pedidos en la base de datos. Crea un pedido primero.\n";
    exit;
}

echo "✓ Pedido encontrado: " . $pedido['codigo_pedido'] . " (ID: " . $pedido['id'] . ")\n";

// Obtener ID del bodeguero
$sql = "SELECT id FROM usuarios WHERE rol = 'bodeguero' LIMIT 1";
$stmt = $db->query($sql);
$bodeguero = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$bodeguero) {
    echo "⚠ No hay bodeguero. Creando uno...\n";
    $sql = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    $password = password_hash('password', PASSWORD_DEFAULT);
    $stmt->execute(['Luis Bodeguero', 'bodeguero@gmail.com', $password, 'bodeguero']);
    $bodeguero_id = $db->lastInsertId();
} else {
    $bodeguero_id = $bodeguero['id'];
}

// Crear reportes de prueba
$reportes = [
    [
        'pedido_id' => $pedido['id'],
        'usuario_id' => $bodeguero_id,
        'tipo' => 'producto_dañado',
        'mensaje' => 'El producto llegó en mal estado',
        'recepcionista_id' => $recepcionista_id
    ],
    [
        'pedido_id' => $pedido['id'],
        'usuario_id' => $bodeguero_id,
        'tipo' => 'falta_producto',
        'mensaje' => 'Falta un producto en el pedido',
        'recepcionista_id' => $recepcionista_id
    ],
    [
        'pedido_id' => $pedido['id'],
        'usuario_id' => $bodeguero_id,
        'tipo' => 'otro',
        'mensaje' => 'Observación general del pedido',
        'recepcionista_id' => $recepcionista_id
    ]
];

echo "\n--- Creando reportes de prueba ---\n";
$sql = "INSERT INTO reportes_pedidos (pedido_id, usuario_id, tipo, mensaje, recepcionista_id) VALUES (?, ?, ?, ?, ?)";
$stmt = $db->prepare($sql);

foreach ($reportes as $reporte) {
    if ($stmt->execute(array_values($reporte))) {
        echo "✓ Reporte creado: " . $reporte['tipo'] . " - " . $reporte['mensaje'] . "\n";
    }
}

// Verificar reportes creados
echo "\n--- Reportes en la base de datos ---\n";
$sql = "SELECT r.*, u.nombre as usuario_nombre 
        FROM reportes_pedidos r 
        JOIN usuarios u ON r.usuario_id = u.id 
        WHERE r.recepcionista_id = ?
        ORDER BY r.fecha_reporte DESC";
$stmt = $db->prepare($sql);
$stmt->execute([$recepcionista_id]);

$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $count++;
    echo "$count. [" . $row['tipo'] . "] " . $row['mensaje'] . " - Por: " . $row['usuario_nombre'] . " (Leída: " . ($row['leida'] ? 'Sí' : 'No') . ")\n";
}

echo "\nTotal de reportes para recepcionista ID $recepcionista_id: $count\n";
?>

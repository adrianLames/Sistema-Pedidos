<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== VERIFICANDO ESTRUCTURA DE TABLA reportes_pedidos ===\n\n";

// Obtener la estructura de la tabla
$query = "DESCRIBE reportes_pedidos";
$stmt = $db->query($query);
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Columnas de la tabla:\n";
foreach ($columns as $col) {
    echo "- " . $col['Field'] . " (" . $col['Type'] . ") " . ($col['Null'] == 'YES' ? 'NULL' : 'NOT NULL') . "\n";
}

echo "\n=== CONTENIDO DE LA TABLA ===\n";
$query = "SELECT * FROM reportes_pedidos";
$stmt = $db->query($query);
$reportes = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\nTotal de registros: " . count($reportes) . "\n\n";

if (count($reportes) > 0) {
    foreach ($reportes as $i => $reporte) {
        echo "Reporte " . ($i + 1) . ":\n";
        foreach ($reporte as $key => $value) {
            echo "  $key: $value\n";
        }
        echo "\n";
    }
}

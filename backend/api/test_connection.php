<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Test de conexión básica
try {
    $conn = new PDO("mysql:host=localhost;dbname=sistema_pedidos", "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verificar tablas
    $tables = [];
    $stmt = $conn->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }
    
    // Contar registros
    $counts = [];
    foreach ($tables as $table) {
        $countStmt = $conn->query("SELECT COUNT(*) as total FROM $table");
        $count = $countStmt->fetch(PDO::FETCH_ASSOC);
        $counts[$table] = $count['total'];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Conexión exitosa',
        'database' => 'sistema_pedidos',
        'tables' => $tables,
        'counts' => $counts
    ], JSON_PRETTY_PRINT);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión',
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>

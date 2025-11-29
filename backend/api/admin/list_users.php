<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== LISTADO DE USUARIOS ===\n\n";

$query = "SELECT id, nombre, email, rol FROM usuarios ORDER BY id";
$stmt = $db->query($query);

echo str_pad("ID", 5) . str_pad("Nombre", 30) . str_pad("Email", 35) . "Rol\n";
echo str_repeat("-", 80) . "\n";

while ($user = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo str_pad($user['id'], 5) . 
         str_pad($user['nombre'], 30) . 
         str_pad($user['email'], 35) . 
         $user['rol'] . "\n";
}

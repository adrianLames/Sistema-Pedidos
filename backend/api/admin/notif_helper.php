<?php
// Mostrar errores para depuración temporal
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// Llama a este helper desde update_status.php cuando haya alerta de stock bajo
function crearNotificacionAdminStock($productos, $db) {
    if (empty($productos)) return;
    $nombres = array_map(function($p) { return $p['nombre'] . " (Stock: " . $p['stock'] . ", Mínimo: " . $p['stock_minimo'] . ")"; }, $productos);
    $mensaje = 'Stock bajo en: ' . implode(', ', $nombres);
    $link = '/admin/productos'; // Ajusta según la ruta de gestión de productos
    $sql = "INSERT INTO notificaciones_admin (tipo, mensaje, link_accion) VALUES ('stock', :mensaje, :link)";
    $stmt = $db->prepare($sql);
    $stmt->execute([':mensaje' => $mensaje, ':link' => $link]);
}
?>

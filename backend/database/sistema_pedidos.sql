-- Crear base de datos
CREATE DATABASE IF NOT EXISTS sistema_pedidos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_pedidos;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'recepcionista', 'bodeguero') NOT NULL,
    token VARCHAR(64) NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de pedidos
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_pedido VARCHAR(20) UNIQUE NOT NULL,
    recepcionista_id INT NOT NULL,
    bodeguero_id INT NULL,
    estado ENUM('pendiente', 'preparacion', 'camino', 'entregado', 'cancelado') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    observaciones TEXT,
    tiempo_preparacion INT NULL,
    fecha_entrega DATETIME NULL,
    FOREIGN KEY (recepcionista_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (bodeguero_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de detalles del pedido
CREATE TABLE detalle_pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
);

-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('info', 'advertencia', 'error', 'exito') DEFAULT 'info',
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de notificaciones para administradores
CREATE TABLE notificaciones_admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    leida TINYINT(1) DEFAULT 0,
    link_accion VARCHAR(255),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reportes de pedidos
CREATE TABLE reportes_pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    mensaje TEXT,
    leida TINYINT(1) DEFAULT 0,
    recepcionista_id INT NULL,
    fecha_reporte DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (recepcionista_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Administrador', 'admin@sistema.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insertar productos de limpieza
INSERT INTO productos (codigo, nombre, descripcion, precio, stock, stock_minimo) VALUES 
('LC-401', 'Jabón industrial desengrasante', 'Jabón industrial desengrasante - Galón', 25000, 15, 5),
('LC-402', 'Paños absorbentes', 'Paños absorbentes - Paquete', 8000, 20, 8),
('LC-403', 'Bolsas industriales resistentes', 'Bolsas industriales resistentes - Paquete', 12000, 30, 10),
('LC-404', 'Trapos de algodón', 'Trapos de algodón - Kg', 15000, 18, 6),
('LC-405', 'Alcohol para limpieza general', 'Alcohol para limpieza general - Litro', 18000, 25, 8);
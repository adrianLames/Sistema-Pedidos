-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 06-12-2025 a las 00:09:04
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sistema_pedidos`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_pedidos`
--

CREATE TABLE `detalle_pedidos` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `detalle_pedidos`
--

INSERT INTO `detalle_pedidos` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`) VALUES
(1, 1, 5, 1, 18000.00),
(2, 1, 3, 1, 12000.00),
(3, 2, 5, 1, 18000.00),
(4, 2, 3, 1, 12000.00),
(5, 3, 5, 1, 18000.00),
(6, 3, 3, 1, 12000.00),
(7, 4, 5, 1, 18000.00),
(8, 4, 3, 1, 12000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `mensaje` text NOT NULL,
  `tipo` enum('info','advertencia','error','exito') DEFAULT 'info',
  `leida` tinyint(1) DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones_admin`
--

CREATE TABLE `notificaciones_admin` (
  `id` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `mensaje` text NOT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `link_accion` varchar(255) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `notificaciones_admin`
--

INSERT INTO `notificaciones_admin` (`id`, `tipo`, `mensaje`, `leida`, `link_accion`, `fecha_creacion`) VALUES
(4, 'stock', 'El producto LC-401 tiene stock bajo (2 unidades restantes)', 1, '/admin/productos', '2025-11-29 09:19:31'),
(5, 'stock', 'El producto LC-405 está agotado', 1, '/admin/productos', '2025-11-29 09:19:31'),
(6, 'sistema', 'Nuevo usuario registrado en el sistema', 0, '/admin/usuarios', '2025-11-29 09:19:31');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `codigo_pedido` varchar(20) NOT NULL,
  `recepcionista_id` int(11) NOT NULL,
  `bodeguero_id` int(11) DEFAULT NULL,
  `estado` enum('pendiente','preparacion','camino','entregado','cancelado') DEFAULT 'pendiente',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `observaciones` text DEFAULT NULL,
  `tiempo_preparacion` int(11) DEFAULT NULL,
  `fecha_entrega` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pedidos`
--

INSERT INTO `pedidos` (`id`, `codigo_pedido`, `recepcionista_id`, `bodeguero_id`, `estado`, `fecha_creacion`, `fecha_actualizacion`, `observaciones`, `tiempo_preparacion`, `fecha_entrega`) VALUES
(1, 'PED20251129613', 2, NULL, 'pendiente', '2025-11-29 13:54:14', '2025-11-29 13:54:14', '', NULL, NULL),
(2, 'PED20251205836', 2, NULL, 'preparacion', '2025-12-05 22:43:32', '2025-12-05 22:44:08', '', NULL, NULL),
(3, 'PED20251206790', 2, NULL, 'pendiente', '2025-12-05 23:00:20', '2025-12-05 23:00:20', '', NULL, NULL),
(4, 'PED20251206779', 2, NULL, 'entregado', '2025-12-05 23:00:41', '2025-12-05 23:02:46', '', 20, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `stock_minimo` int(11) NOT NULL DEFAULT 5,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `codigo`, `nombre`, `descripcion`, `precio`, `stock`, `stock_minimo`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'LC-401', 'Jabón industrial desengrasante', 'Jabón industrial desengrasante - Galón', 25000.00, 15, 5, 1, '2025-11-29 13:34:43', '2025-11-29 13:34:43'),
(2, 'LC-402', 'Paños absorbentes', 'Paños absorbentes - Paquete', 8000.00, 20, 8, 1, '2025-11-29 13:34:43', '2025-11-29 13:34:43'),
(3, 'LC-403', 'Bolsas industriales resistentes', 'Bolsas industriales resistentes - Paquete', 12000.00, 24, 10, 1, '2025-11-29 13:34:43', '2025-12-05 23:01:47'),
(4, 'LC-404', 'Trapos de algodón', 'Trapos de algodón - Kg', 15000.00, 18, 6, 1, '2025-11-29 13:34:43', '2025-11-29 13:34:43'),
(5, 'LC-405', 'Alcohol para limpieza general', 'Alcohol para limpieza general - Litro', 18000.00, 19, 8, 1, '2025-11-29 13:34:43', '2025-12-05 23:01:47'),
(6, 'JB002', 'Jabon', '', 1000.00, 11, 5, 1, '2025-12-05 22:56:49', '2025-12-05 22:57:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_pedidos`
--

CREATE TABLE `reportes_pedidos` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `mensaje` text DEFAULT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `recepcionista_id` int(11) DEFAULT NULL,
  `fecha_reporte` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_pedidos`
--

INSERT INTO `reportes_pedidos` (`id`, `pedido_id`, `usuario_id`, `tipo`, `mensaje`, `leida`, `recepcionista_id`, `fecha_reporte`) VALUES
(4, 1, 3, 'producto_dañado', 'Producto LC-402 con envase dañado detectado en almacén', 1, 2, '2025-11-29 09:19:10'),
(5, 1, 3, 'falta_producto', 'Stock insuficiente de LC-404 para completar el pedido', 1, 2, '2025-11-29 09:19:10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','recepcionista','bodeguero') NOT NULL,
  `token` varchar(64) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`, `token`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Administrador', 'admin@sistema.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'bb481677d2d6a4dbd33d405ff68c4dec75d2e0ee7a7d7f8306380ebd4bfde6f8', 1, '2025-11-29 13:34:43', '2025-12-05 23:03:49'),
(2, 'julian', 'recepcionista@gmail.com', '$2y$10$C2GbSPe2IFMTZwUBVbmMkOQePELoXhZV9eXxu7byZkRfF18jrZnIq', 'recepcionista', '4263292f7960a8249e8a9fadf0d5df316ecd37e40c938d8791e62c52289941dd', 1, '2025-11-29 13:39:59', '2025-12-05 23:02:23'),
(3, 'luis', 'bodeguero@gmail.com', '$2y$10$ixH4HpWNKrS62rOxd66tweGUf6liUW//jeUCrjWqruhYFZ4iEZOjS', 'bodeguero', '9f97eea04bca9bee1eee8ca36e8fe2c0399c97a17a84919881c38dbf51171ddd', 1, '2025-11-29 13:56:17', '2025-12-05 23:02:38');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `detalle_pedidos`
--
ALTER TABLE `detalle_pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pedido_id` (`pedido_id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `notificaciones_admin`
--
ALTER TABLE `notificaciones_admin`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo_pedido` (`codigo_pedido`),
  ADD KEY `recepcionista_id` (`recepcionista_id`),
  ADD KEY `bodeguero_id` (`bodeguero_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `reportes_pedidos`
--
ALTER TABLE `reportes_pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pedido_id` (`pedido_id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `recepcionista_id` (`recepcionista_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `detalle_pedidos`
--
ALTER TABLE `detalle_pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `notificaciones_admin`
--
ALTER TABLE `notificaciones_admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `reportes_pedidos`
--
ALTER TABLE `reportes_pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_pedidos`
--
ALTER TABLE `detalle_pedidos`
  ADD CONSTRAINT `detalle_pedidos_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_pedidos_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`);

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`recepcionista_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`bodeguero_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `reportes_pedidos`
--
ALTER TABLE `reportes_pedidos`
  ADD CONSTRAINT `reportes_pedidos_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reportes_pedidos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reportes_pedidos_ibfk_3` FOREIGN KEY (`recepcionista_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

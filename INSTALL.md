# Sistema de Pedidos - Recepción a Bodega

Sistema web para automatización de envío de pedidos desde recepción hasta bodega, con gestión de usuarios, productos y seguimiento de pedidos.

## 🚀 Características

- ✅ **Sistema de autenticación** con roles (Admin, Recepcionista, Bodeguero)
- ✅ **Gestión de productos** con control de inventario
- ✅ **Creación y seguimiento de pedidos**
- ✅ **Alertas de stock bajo** automáticas
- ✅ **Reportes y notificaciones** en tiempo real
- ✅ **Interfaz accesible** (WCAG 2.1 AA/AAA)
- ✅ **Responsive design** para móviles y tablets

## 📋 Requisitos del Sistema

- **XAMPP** 7.4 o superior (PHP + MySQL)
- **Node.js** 14 o superior
- **npm** 6 o superior
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

## 🔧 Instalación

### 1. Configurar Base de Datos

1. Abrir XAMPP y iniciar **Apache** y **MySQL**
2. Acceder a phpMyAdmin: `http://localhost/phpmyadmin`
3. Crear la base de datos ejecutando el script SQL completo:

```sql
-- Abrir el archivo: backend/database/sistema_pedidos.sql
-- Copiar y ejecutar todo el contenido en phpMyAdmin
```

Este script creará:
- Base de datos `sistema_pedidos`
- 7 tablas (usuarios, productos, pedidos, detalle_pedidos, notificaciones, notificaciones_admin, reportes_pedidos)
- Usuario administrador por defecto
- Productos de ejemplo

**Credenciales de prueba:**
- Email: `admin@sistema.com`
- Password: `password`

### 2. Configurar Backend (PHP)

El backend ya está configurado para conectarse a MySQL local:
- Host: `localhost`
- Usuario: `root`
- Password: *(vacío)*
- Base de datos: `sistema_pedidos`

Si tu configuración es diferente, edita: `backend/api/config/database.php`

### 3. Configurar Frontend (React)

1. Abrir terminal en la carpeta del proyecto:
```powershell
cd C:\xampp\htdocs\Sistema-Pedidos
```

2. Instalar dependencias:
```powershell
npm install
```

3. Verificar configuración del archivo `.env`:
```env
REACT_APP_API_BASE=http://localhost/Sistema-Pedidos/backend/api
```

### 4. Iniciar la Aplicación

```powershell
npm start
```

La aplicación se abrirá automáticamente en: `http://localhost:3000`

## 👥 Roles y Permisos

### Administrador
- Gestión completa de usuarios
- Gestión de productos (crear, editar, actualizar stock)
- Visualización de todos los pedidos
- Notificaciones de stock bajo

### Recepcionista
- Crear nuevos pedidos
- Ver lista de pedidos propios
- Generar reportes de problemas
- Ver notificaciones de reportes

### Bodeguero
- Procesar pedidos pendientes
- Actualizar estado de pedidos
- Ver alertas de stock
- Reportar problemas en pedidos

## 📁 Estructura del Proyecto

```
Sistema-Pedidos/
├── backend/
│   ├── api/
│   │   ├── admin/          # Endpoints admin (notificaciones)
│   │   ├── auth/           # Autenticación (login, validate)
│   │   ├── config/         # Configuración DB y CORS
│   │   ├── orders/         # Gestión de pedidos
│   │   ├── products/       # Gestión de productos
│   │   └── users/          # Gestión de usuarios
│   └── database/           # Scripts SQL
├── public/                 # Archivos públicos
├── src/
│   ├── components/
│   │   ├── admin/         # Componentes de administrador
│   │   ├── bodeguero/     # Componentes de bodeguero
│   │   ├── recepcionista/ # Componentes de recepcionista
│   │   └── common/        # Componentes compartidos
│   ├── context/           # React Context (Auth, Notifications, Products)
│   ├── pages/             # Páginas principales
│   ├── styles/            # Estilos globales
│   └── utils/             # Utilidades y helpers
└── package.json
```

## 🔐 API Endpoints

### Autenticación
- `POST /auth/login.php` - Iniciar sesión
- `GET /auth/validate.php` - Validar token

### Productos
- `GET /products/get_all.php` - Listar productos
- `POST /products/create.php` - Crear producto
- `POST /products/update.php` - Actualizar producto
- `GET /products/stock_alert.php` - Alertas de stock

### Pedidos
- `GET /orders/get_all.php` - Listar pedidos
- `POST /orders/create.php` - Crear pedido
- `GET /orders/get_details.php?id={id}` - Detalle de pedido
- `POST /orders/update_status.php` - Actualizar estado
- `POST /orders/reportes.php` - Crear reporte de problema

### Usuarios
- `GET /users/get_all.php` - Listar usuarios
- `POST /users/create.php` - Crear usuario
- `POST /users/update.php` - Actualizar usuario

## 🛠️ Solución de Problemas

### Error de conexión a la base de datos
- Verificar que XAMPP MySQL esté corriendo
- Confirmar que la base de datos existe: `sistema_pedidos`
- Revisar credenciales en `backend/api/config/database.php`

### Error de CORS
- Verificar que la URL en `.env` coincida con la carpeta en XAMPP
- Limpiar caché del navegador
- Reiniciar Apache en XAMPP

### Página en blanco al iniciar
- Abrir la consola del navegador (F12) y verificar errores
- Confirmar que `npm install` se ejecutó correctamente
- Verificar que el puerto 3000 esté disponible

### Token inválido al hacer login
- Verificar que el usuario exista en la base de datos
- Confirmar que la contraseña sea correcta (default: `password`)
- Revisar logs en la consola del navegador

## 🎨 Características de Accesibilidad

- **Navegación por teclado**: Soporte completo para Tab, Enter, Escape
- **Lectores de pantalla**: ARIA labels y live regions
- **Alto contraste**: Soporte para modo de alto contraste
- **Reducción de movimiento**: Respeta preferencias del usuario
- **Skip links**: Navegación rápida al contenido principal
- **Etiquetas semánticas**: HTML5 semántico completo

## 📝 Notas de Desarrollo

### Crear nuevos usuarios
Usa el panel de administrador o ejecuta en phpMyAdmin:

```sql
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Juan Pérez', 'recepcionista@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'recepcionista');
```

### Generar hash de contraseña
```php
<?php echo password_hash('tu_contraseña', PASSWORD_DEFAULT); ?>
```

## 📄 Licencia

Este proyecto es de uso educativo y empresarial.

## 👨‍💻 Soporte

Para problemas o consultas, revisar:
1. Logs de Apache en XAMPP (`xampp/apache/logs/error.log`)
2. Consola del navegador (F12)
3. Respuestas de la API en la pestaña Network

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2025

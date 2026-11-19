# EntreLíneas · Librería en línea

Aplicación web de una librería construida con Node.js, Express, SQLite, HTML, CSS y JavaScript.

## Requisitos

- Node.js 18 o superior.
- npm.

## Instalación y ejecución

Desde la carpeta del proyecto:

```bash
cd backend
npm install
npm start
```

Abre `http://localhost:3000` en el navegador.

Para desarrollo, puedes ejecutar `npm run dev` y el servidor se reiniciará cuando detecte cambios.

## Usuario y datos de prueba

- Correo: `jramirez12@correo.com`
- Contraseña: `Clave123`
- Código de descuento: `BIENVENIDO10`

La base de datos SQLite se crea automáticamente en `database/entrelineas.db` durante el primer inicio. Las tablas y los datos iniciales se cargan desde `database/schema.sql` y `database/datos.sql`.

Para eliminar la base local y volver a crearla con los datos de ejemplo:

```bash
cd backend
npm run db:reset
```

Este comando elimina los datos guardados en la base local. Úsalo solo cuando quieras reiniciar el proyecto.

## Configuración para producción

Define estas variables de entorno antes de iniciar el servidor:

```bash
NODE_ENV=production
SESSION_SECRET=una-frase-secreta-larga-y-aleatoria
PORT=3000
```

En producción la aplicación exige `SESSION_SECRET` y habilita cookies `secure`, por lo que debe servirse mediante HTTPS. Para un despliegue real también se recomienda configurar un almacén de sesiones persistente; `express-session` usa su almacén en memoria por defecto, adecuado únicamente para desarrollo y pruebas.

## Estructura del proyecto

```text
entrelineas-repo/
├── backend/
│   ├── server.js             # Configuración e inicio de Express
│   └── src/
│       ├── db.js              # Conexión e inicialización de SQLite
│       ├── util.js            # Constantes y middleware compartidos
│       └── routes/
│           ├── catalogo.js    # Inicio, catálogo, libros y reseñas
│           ├── compra.js      # Carrito, pagos y pedidos
│           └── usuario.js     # Autenticación y biblioteca
├── database/
│   ├── schema.sql             # Tablas, índices y vista
│   └── datos.sql              # Datos de ejemplo
├── docs/
│   └── diagrama_er.mermaid
└── frontend/
    ├── *.html                 # Una página por sección
    ├── css/styles.css         # Estilos
    └── js/app.js              # Interfaz y consumo de la API
```

## Observaciones

- Las consultas SQL usan parámetros para evitar concatenar valores del usuario directamente en las consultas.
- Las rutas protegidas comprueban la sesión antes de permitir operaciones privadas.
- La creación del pedido se ejecuta dentro de una transacción: si falla una actualización de inventario, se revierte la operación completa.
- Los índices adicionales ayudan a acelerar búsquedas frecuentes por categoría, biblioteca, reseñas y pedidos.

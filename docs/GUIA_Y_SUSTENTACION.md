# EntreLineas: guia de uso, arquitectura y sustentacion

## 1. Descripcion general

EntreLineas es una aplicacion web para explorar, buscar y comprar libros. Permite iniciar sesion, consultar el catalogo, revisar detalles de un libro, guardar productos en una biblioteca personal, agregarlos al carrito y crear pedidos.

La aplicacion utiliza:

- Frontend: HTML, CSS y JavaScript.
- Backend: Node.js y Express.
- Base de datos: SQLite mediante `better-sqlite3`.
- Sesiones: `express-session`.
- Seguridad de contraseñas: `bcryptjs`.

## 2. Requisitos

Instalar antes de ejecutar el proyecto:

- Node.js 18 o superior.
- npm, incluido con Node.js.
- Navegador web moderno.

Verificar la instalacion:

```bash
node --version
npm --version
```

## 3. Instalacion y ejecucion

Desde la terminal, ubicarse en la carpeta raiz del proyecto:

```bash
cd "C:\Users\juanl\Downloads\Libreria entre lineas"
cd backend
npm install
npm start
```

Abrir en el navegador:

```text
http://localhost:3000
```

Para desarrollo con reinicio automatico:

```bash
npm run dev
```

Para detener el servidor, presionar `Ctrl + C` en la terminal.

## 4. Datos de prueba

Usuario local de ejemplo:

- Correo: `jramirez12@correo.com`
- Contraseña: `Clave123`

Codigo de descuento disponible:

- `BIENVENIDO10`

La base de datos se guarda en `database/entrelineas.db`. En el primer inicio, el backend ejecuta `database/schema.sql` y `database/datos.sql` para crear las tablas y cargar datos de ejemplo.

Para restablecer la base de datos:

```bash
cd backend
npm run db:reset
npm start
```

`npm run db:reset` elimina los datos locales, incluido el progreso de usuarios y pedidos de prueba.

## 5. Como usar la aplicacion

### Inicio

En la pagina principal aparecen las promociones, secciones destacadas, novedades y libros del mes. Cada tarjeta permite abrir la ficha completa del libro.

### Registro e inicio de sesion

Desde el menu lateral se puede crear una cuenta o iniciar sesion.

- El registro valida los datos y guarda una contraseña cifrada.
- El inicio de sesion compara la contraseña con el hash almacenado.
- Una cookie identifica la sesion del usuario.

### Catalogo

La pagina de catalogo permite:

- Buscar por titulo, autor o ISBN.
- Filtrar por categoria, idioma, editorial y año.
- Mostrar libros fisicos o digitales.
- Ordenar por relevancia, precio o calificacion.
- Consultar ofertas.

### Ficha de producto

Cada libro muestra autor, editorial, categoria, año, idioma, paginas, encuadernacion, precio, descuento, disponibilidad y reseñas.

Un usuario autenticado puede:

- Agregar el libro al carrito.
- Agregarlo a favoritos.
- Cambiar su estado a leyendo, lista de deseos o completado.
- Escribir una reseña, si no existe una previa para ese libro.
- Marcar una reseña como util o no util.

### Carrito y compra

El usuario puede cambiar cantidades, quitar productos y continuar al pago.

Durante la confirmacion:

1. Se revisan los productos y su precio.
2. Se aplica el IVA configurado.
3. Se puede ingresar un codigo de descuento.
4. Se selecciona direccion y metodo de pago.
5. Se crea el pedido dentro de una transaccion.

Si una operacion falla, SQLite revierte la transaccion completa para evitar pedidos incompletos o cambios incorrectos en el inventario.

### Biblioteca

La pagina de biblioteca agrupa los libros guardados segun su estado:

- Favoritos.
- Leyendo.
- Lista de deseos.
- Completados.

## 6. Funcionamiento interno

### Flujo de una solicitud

El flujo general es:

```text
Navegador
  -> pagina HTML
  -> JavaScript llama a /api
  -> Express recibe la solicitud
  -> middleware de sesion valida identidad
  -> ruta consulta SQLite
  -> SQLite devuelve datos
  -> Express responde JSON
  -> JavaScript actualiza la pagina
```

### Backend

`backend/server.js` configura Express, las sesiones, las rutas API y los archivos estaticos del frontend.

Los archivos de rutas tienen responsabilidades separadas:

- `catalogo.js`: inicio, filtros, libros y reseñas.
- `usuario.js`: registro, inicio de sesion, cierre de sesion y biblioteca.
- `compra.js`: carrito, metodos de pago, pedidos y compras.
- `util.js`: autenticacion de rutas, estados y valores compartidos.
- `db.js`: conexion SQLite, creación inicial y migraciones pequeñas.

Las rutas privadas usan el middleware `login`. Si no existe un usuario en la sesion, responden HTTP 401.

### Frontend

Las paginas HTML contienen contenedores vacios que JavaScript llena dinamicamente.

`frontend/js/app.js`:

- Detecta la pagina activa mediante el atributo `data-page`.
- Realiza solicitudes mediante `fetch` a rutas `/api`.
- Convierte respuestas JSON en componentes HTML.
- Escapa texto recibido de la base de datos para evitar HTML no autorizado.
- Muestra mensajes de error y redirige al inicio de sesion cuando corresponde.

`frontend/css/styles.css` contiene las variables visuales, componentes, diseño responsivo y estados interactivos.

### Base de datos

Las tablas principales son:

- `usuario`: cuentas y contraseñas cifradas.
- `autor`, `editorial`, `idioma` y `categoria`: datos descriptivos.
- `libro`: libros, stock, precio y descuentos.
- `libro_categoria`: relacion muchos a muchos entre libros y categorias.
- `biblioteca`: estados personales de cada usuario.
- `resena` y `voto_resena`: opiniones y votos de utilidad.
- `carrito` y `carrito_item`: productos pendientes de compra.
- `pedido` y `pedido_item`: compras confirmadas.
- `direccion`, `metodo_pago` y `codigo_descuento`: datos necesarios para finalizar una compra.

La vista `vista_catalogo` calcula el precio final, el promedio de calificaciones y el numero de reseñas.

## 7. Endpoints principales

| Metodo | Ruta | Funcion |
|---|---|---|
| GET | `/api/home` | Datos destacados de inicio |
| GET | `/api/filtros` | Opciones de filtros |
| GET | `/api/libros` | Catalogo filtrado |
| GET | `/api/libros/:id` | Detalle de un libro |
| POST | `/api/auth/registro` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesion |
| POST | `/api/auth/salir` | Cerrar sesion |
| GET | `/api/biblioteca` | Biblioteca del usuario |
| GET | `/api/carrito` | Carrito del usuario |
| POST | `/api/pedidos` | Crear pedido |

## 8. Seguridad y buenas practicas

- Las contraseñas no se guardan como texto plano: se usa bcrypt.
- Las sesiones se guardan en una cookie del navegador.
- Las rutas privadas verifican el usuario autenticado.
- Las consultas SQL parametrizadas evitan mezclar datos con instrucciones SQL.
- Se limita el tamaño del cuerpo JSON recibido.
- Los datos mostrados en el navegador se escapan antes de insertarlos en HTML.
- Las claves foraneas y las restricciones de SQLite mantienen la integridad referencial.

En produccion se debe configurar `SESSION_SECRET` y servir la aplicacion por HTTPS.

## 9. Guion para sustentar ante una clase

### Duracion sugerida: 8 a 10 minutos

**1. Introduccion - 1 minuto**

"Nuestro proyecto es EntreLineas, una aplicacion web de libreria en linea desarrollada con Node.js, Express, SQLite, HTML, CSS y JavaScript. Su objetivo es permitir buscar libros, gestionar una biblioteca personal y realizar compras mediante una experiencia sencilla."

**2. Arquitectura - 1 minuto**

"La aplicacion tiene una arquitectura cliente-servidor. El navegador ejecuta el frontend; Express ofrece una API y entrega los archivos estaticos; y SQLite almacena usuarios, libros, carrito y pedidos."

**3. Demo de inicio y registro - 1 minuto**

"En la pagina principal se cargan las secciones mediante una solicitud `/api/home`. Desde el menu podemos crear una cuenta o iniciar sesion con el usuario de prueba. La contraseña se cifra con bcrypt antes de guardarse."

**4. Demo del catalogo - 1 minuto**

"En catalogo podemos buscar por titulo, autor o ISBN y aplicar filtros. JavaScript envia los parametros a `/api/libros`, el backend ejecuta una consulta y devuelve JSON que se convierte en tarjetas."

**5. Demo de producto y biblioteca - 1 minuto**

"Cada tarjeta abre el detalle del libro. Una ruta protegida permite agregarlo a favoritos o cambiar su estado de lectura. Las rutas protegidas necesitan una sesion activa."

**6. Demo del carrito y compra - 2 minutos**

"El carrito se guarda relacionado con el usuario. Podemos modificar cantidades y crear un pedido. El backend calcula el subtotal, aplica el IVA y el descuento, guarda direccion y metodo de pago y crea los registros asociados. Esto ocurre dentro de una transaccion para evitar pedidos incompletos."

**7. Base de datos - 1 minuto**

"SQLite contiene las entidades principales del sistema. Las tablas de usuario, libro, biblioteca, resenas y pedidos se relacionan mediante claves primarias y foraneas. La vista `vista_catalogo` calcula informacion derivada como el precio final y la calificacion promedio."

**8. Seguridad y cierre - 1 minuto**

"Protegemos contraseñas, sesiones y rutas privadas. Parametrizamos las consultas y usamos restricciones y transacciones. Para cerrar, EntreLineas integra frontend, API y base de datos para resolver un caso real de comercio electronico de libros."

## 10. Preguntas probables y respuestas

**¿Por que usan SQLite?**

Porque es liviana, no requiere instalar un servidor independiente y permite guardar el proyecto en un archivo local.

**¿Donde se valida el usuario?**

El servidor verifica la sesion. Al iniciar sesion se guarda el identificador del usuario en `req.session.uid`; las rutas protegidas comprueban ese valor mediante el middleware `login`.

**¿Que pasa si falla una compra?**

La transaccion confirma todos los cambios solo si todas las operaciones terminan correctamente. Si ocurre un error, se revierte todo.

**¿La contraseña queda visible en la base de datos?**

No. Se guarda un hash generado por bcrypt. Para iniciar sesion, el servidor compara la contraseña ingresada con ese hash.

**¿Como se evita que un usuario modifique datos de otro?**

Las operaciones privadas usan el identificador obtenido de la sesion del usuario, no un identificador enviado libremente por el cliente para elegir la identidad.

**¿Como se calcula el precio final?**

La vista de catalogo toma el precio base y aplica el porcentaje de descuento configurado en `descuento_pct`. El frontend también muestra el precio original tachado cuando existe descuento.

**¿Como reiniciar el sistema?**

Se elimina la base local con `npm run db:reset` y se inicia el servidor nuevamente para recrearla con los archivos SQL de ejemplo.

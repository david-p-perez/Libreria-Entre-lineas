# EntreLineas: guia de uso, arquitectura y sustentacion
# DAVID PEREZ
# PROFESOR EDGAR VERGEL
# DESARROLLO WEB 24442
## 1. Descripcion general

EntreLineas es una aplicacion web para explorar, buscar y comprar libros. Permite iniciar sesion, consultar el catalogo, revisar detalles de un libro, guardar productos en una biblioteca personal, agregarlos al carrito y crear pedidos.

La aplicacion utiliza:

- Frontend: HTML, CSS y JavaScript.
- Backend: Node.js y Express.
- Base de datos: SQLite mediante `better-sqlite3`.
- Sesiones: `express-session`.
- Seguridad de contraseñas: `bcryptjs`.

La interfaz se entrega como un conjunto de páginas responsivas. Incluye menú lateral,
busqueda global, catálogo con filtros, fichas de producto, biblioteca personal,
carrito, confirmacion de pedidos y pie de pagina con informacion de contacto y redes
sociales.

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

Para una configuracion de produccion se pueden definir variables de entorno:

```bash
NODE_ENV=production
SESSION_SECRET=una-frase-secreta-larga-y-aleatoria
PORT=3000
```

En produccion el servidor exige `SESSION_SECRET`, activa la cookie segura y utiliza el
proxy confiable. La aplicacion debe servirse mediante HTTPS. Las sesiones usan el
almacen en memoria de `express-session`, por lo que para un despliegue real se recomienda
un almacenamiento persistente.

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
- Consultar ofertas mediante el filtro `Ofertas en libros seleccionados`.

Los libros con descuento muestran una etiqueta con el porcentaje aplicado y comparan
el precio original tachado con el precio final. La promocion principal anuncia hasta
80 % de descuento y permite abrir directamente el listado de ofertas.

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
2. Se calculan los descuentos individuales de los libros.
3. Se aplica el IVA del 19 %.
4. Se puede ingresar el codigo `BIENVENIDO10`.
5. El descuento del codigo se calcula sobre el subtotal despues de las ofertas de los libros.
6. Se selecciona direccion y metodo de pago.
7. Se crea el pedido dentro de una transaccion.

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

La interfaz tiene una presentacion renovada: tarjetas de producto con precio rebajado,
insignias de descuento, secciones destacadas, contenedores redondeados y un pie de
pagina con enlaces de contacto y redes sociales. Los estilos incluyen adaptaciones para
pantallas de hasta 860 px y 540 px, ademas de soporte para movimiento reducido.

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
La columna `descuento_pct` permite configurar ofertas por libro entre 0 % y 80 %. Si se
abre una base creada antes de esta modificacion, `backend/src/db.js` agrega la columna
mediante una migracion automatica y carga las ofertas iniciales.

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
| GET | `/api/auth/yo` | Usuario activo en la sesion |
| GET | `/api/carrito` | Carrito del usuario |
| GET | `/api/metodos-pago` | Metodos de pago disponibles |
| GET | `/api/pedidos` | Pedidos del usuario autenticado |
| POST | `/api/pedidos` | Crear pedido |
| POST | `/api/carrito/:id` | Agregar o sumar unidades al carrito |
| DELETE | `/api/carrito/:id` | Quitar un producto del carrito |
| POST | `/api/libros/:id/resenas` | Crear la reseña de un libro |
| POST | `/api/resenas/:id/voto` | Marcar una reseña como util o no util |

## 8. Seguridad y buenas practicas

- Las contraseñas no se guardan como texto plano: se usa bcrypt.
- Las sesiones se guardan en una cookie del navegador.
- Las rutas privadas verifican el usuario autenticado.
- Las consultas SQL parametrizadas evitan mezclar datos con instrucciones SQL.
- Se limita el tamaño del cuerpo JSON recibido.
- Los datos mostrados en el navegador se escapan antes de insertarlos en HTML.
- Las claves foraneas y las restricciones de SQLite mantienen la integridad referencial.
- En produccion se exige una variable `SESSION_SECRET`; las cookies usan `secure`, `httpOnly` y `sameSite`.

En produccion se debe configurar `SESSION_SECRET` y servir la aplicacion por HTTPS.

**guion -**

**1. Introduccion - 1**

"Nuestro proyecto es EntreLineas, una aplicacion web de libreria en linea desarrollada con Node.js, Express, SQLite, HTML, CSS y JavaScript. Su objetivo es permitir buscar libros, gestionar una biblioteca personal y realizar compras mediante una experiencia sencilla."

**2. Arquitectura - 1 **

"La aplicacion tiene una arquitectura cliente-servidor. El navegador ejecuta el frontend; Express ofrece una API y entrega los archivos estaticos; y SQLite almacena usuarios, libros, carrito y pedidos."

**3. Demo de inicio y registro -**

"En la pagina principal se cargan las secciones mediante una solicitud `/api/home`. Desde el menu podemos crear una cuenta o iniciar sesion con el usuario de prueba. La contraseña se cifra con bcrypt antes de guardarse."



**4. Demo del catalogo -**

"En catalogo podemos buscar por titulo, autor o ISBN y aplicar filtros por categoria,
idioma, editorial, año y formato. Tambien podemos abrir el listado exclusivo de ofertas.
JavaScript envia los parametros a `/api/libros`, el backend ejecuta una consulta y
devuelve JSON que se convierte en tarjetas con insignia y precio rebajado."

**5. Demo de producto y biblioteca -**

"Cada tarjeta abre el detalle del libro. Una ruta protegida permite agregarlo a favoritos o cambiar su estado de lectura. Las rutas protegidas necesitan una sesion activa."

**6. Demo del carrito y compra -**

"El carrito se guarda relacionado con el usuario. Podemos modificar cantidades y crear
un pedido. El backend calcula el subtotal, resta el descuento de los libros y el codigo
promocional, aplica el IVA del 19 % y guarda direccion y metodo de pago. Esto ocurre
dentro de una transaccion para evitar pedidos incompletos y cambios incorrectos en el inventario."

**7. Base de datos -**

"SQLite contiene las entidades principales del sistema. Las tablas de usuario, libro,
biblioteca, resenas y pedidos se relacionan mediante claves primarias y foraneas. La
vista `vista_catalogo` calcula informacion derivada como el precio final y la calificacion
promedio. Los registros de descuentos por libro llegan hasta 80 % y se agregan mediante
una migracion automatica si la base es anterior."

**8. Seguridad y cierre -**

"Protegemos contraseñas, sesiones y rutas privadas. Parametrizamos las consultas y
usamos restricciones y transacciones. En produccion exigimos `SESSION_SECRET`, habilitamos
cookies seguras y recomendamos HTTPS. Para cerrar, EntreLineas integra una interfaz
responsiva, una API y una base de datos para resolver un caso real de comercio electronico de libros."


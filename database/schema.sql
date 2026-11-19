-- EntreLíneas · Esquema relacional (SQLite; en MySQL cambia AUTOINCREMENT por AUTO_INCREMENT)
PRAGMA foreign_keys = ON;

CREATE TABLE usuario (
  id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  nombre_usuario TEXT UNIQUE,
  contrasena_hash TEXT,                       -- NULL si ingresa con Google/Facebook
  proveedor TEXT NOT NULL DEFAULT 'local' CHECK (proveedor IN ('local','google','facebook')),
  avatar_url TEXT,
  acepta_terminos INTEGER NOT NULL DEFAULT 0 CHECK (acepta_terminos IN (0,1)),
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE autor     (id_autor INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE, pais TEXT);
CREATE TABLE editorial (id_editorial INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE);
CREATE TABLE idioma    (id_idioma INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE);
CREATE TABLE categoria (id_categoria INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE);

CREATE TABLE libro (
  id_libro INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  isbn TEXT UNIQUE,
  id_autor INTEGER NOT NULL REFERENCES autor(id_autor),
  id_editorial INTEGER REFERENCES editorial(id_editorial),
  id_idioma INTEGER NOT NULL REFERENCES idioma(id_idioma),
  formato TEXT NOT NULL DEFAULT 'fisico' CHECK (formato IN ('fisico','digital')),
  anio INTEGER,
  num_paginas INTEGER CHECK (num_paginas > 0),
  encuadernacion TEXT,
  resena TEXT,
  precio INTEGER NOT NULL CHECK (precio >= 0),   -- pesos colombianos, sin impuestos
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  origen TEXT NOT NULL DEFAULT 'Colombia',
  es_nuevo INTEGER NOT NULL DEFAULT 1 CHECK (es_nuevo IN (0,1)),
  portada_url TEXT,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_libro_titulo ON libro(titulo);
CREATE INDEX idx_libro_autor ON libro(id_autor);

CREATE TABLE libro_categoria (
  id_libro INTEGER NOT NULL REFERENCES libro(id_libro) ON DELETE CASCADE,
  id_categoria INTEGER NOT NULL REFERENCES categoria(id_categoria),
  PRIMARY KEY (id_libro, id_categoria)
);
-- Pantalla "Biblioteca": Favoritos / Leyendo / Lista de deseos / Completados
CREATE TABLE biblioteca (
  id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  id_libro INTEGER NOT NULL REFERENCES libro(id_libro) ON DELETE CASCADE,
  estado TEXT NOT NULL CHECK (estado IN ('favorito','leyendo','lista_deseos','completado')),
  agregado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_libro, estado)
);
CREATE TABLE resena (
  id_resena INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
  id_libro INTEGER NOT NULL REFERENCES libro(id_libro) ON DELETE CASCADE,
  calificacion INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  compra_verificada INTEGER NOT NULL DEFAULT 0 CHECK (compra_verificada IN (0,1)),
  fecha TEXT NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (id_usuario, id_libro)
);
CREATE TABLE voto_resena (
  id_resena INTEGER NOT NULL REFERENCES resena(id_resena) ON DELETE CASCADE,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
  es_util INTEGER NOT NULL CHECK (es_util IN (0,1)),   -- 1 "Esta opinión es útil", 0 "No es útil"
  PRIMARY KEY (id_resena, id_usuario)
);
CREATE TABLE pregunta (
  id_pregunta INTEGER PRIMARY KEY AUTOINCREMENT,
  id_libro INTEGER NOT NULL REFERENCES libro(id_libro) ON DELETE CASCADE,
  pregunta TEXT NOT NULL,
  respuesta TEXT
);
-- Inicio: Destacados, Libros Colombia en tendencia, Novedades Ficción en Colombia
CREATE TABLE seccion (id_seccion INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE, orden INTEGER NOT NULL);
CREATE TABLE seccion_libro (
  id_seccion INTEGER NOT NULL REFERENCES seccion(id_seccion) ON DELETE CASCADE,
  id_libro INTEGER NOT NULL REFERENCES libro(id_libro) ON DELETE CASCADE,
  posicion INTEGER NOT NULL,
  PRIMARY KEY (id_seccion, id_libro)
);
CREATE TABLE autor_del_mes (
  id_autor INTEGER NOT NULL REFERENCES autor(id_autor),
  ambito TEXT NOT NULL CHECK (ambito IN ('colombia','internacional')),
  mes TEXT NOT NULL,                            -- 'AAAA-MM'
  PRIMARY KEY (ambito, mes)
);
CREATE TABLE metodo_pago (id_metodo INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE);
CREATE TABLE codigo_descuento (
  codigo TEXT PRIMARY KEY,
  porcentaje INTEGER NOT NULL CHECK (porcentaje BETWEEN 1 AND 100),
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1))
);
CREATE TABLE direccion (
  id_direccion INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  destinatario TEXT NOT NULL, telefono TEXT,
  departamento TEXT NOT NULL, ciudad TEXT NOT NULL, direccion TEXT NOT NULL
);
CREATE TABLE carrito (
  id_carrito INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER NOT NULL UNIQUE REFERENCES usuario(id_usuario) ON DELETE CASCADE
);
CREATE TABLE carrito_item (
  id_carrito INTEGER NOT NULL REFERENCES carrito(id_carrito) ON DELETE CASCADE,
  id_libro INTEGER NOT NULL REFERENCES libro(id_libro),
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  PRIMARY KEY (id_carrito, id_libro)
);
CREATE TABLE pedido (
  id_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
  id_direccion INTEGER NOT NULL REFERENCES direccion(id_direccion),
  id_metodo INTEGER NOT NULL REFERENCES metodo_pago(id_metodo),
  codigo TEXT REFERENCES codigo_descuento(codigo),
  subtotal INTEGER NOT NULL, impuestos INTEGER NOT NULL, descuento INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','enviado','entregado','cancelado')),
  envio_desde TEXT, envio_hasta TEXT,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE pedido_item (
  id_pedido INTEGER NOT NULL REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  id_libro INTEGER NOT NULL REFERENCES libro(id_libro),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario INTEGER NOT NULL,             -- precio al momento de la compra
  PRIMARY KEY (id_pedido, id_libro)
);
CREATE INDEX idx_libro_categoria_categoria ON libro_categoria(id_categoria);
CREATE INDEX idx_biblioteca_usuario_estado ON biblioteca(id_usuario, estado);
CREATE INDEX idx_resena_libro_fecha ON resena(id_libro, fecha DESC);
CREATE INDEX idx_pedido_usuario_fecha ON pedido(id_usuario, creado_en DESC);
CREATE INDEX idx_carrito_usuario ON carrito(id_usuario);

-- Tarjetas del catálogo: estrellas y número de reseñas se calculan, no se guardan
CREATE VIEW vista_catalogo AS
SELECT l.id_libro, l.titulo, a.nombre AS autor, e.nombre AS editorial, i.nombre AS idioma,
       l.formato, l.anio, l.stock, l.precio, l.portada_url,
       ROUND(AVG(r.calificacion),1) AS calificacion, COUNT(r.id_resena) AS num_resenas
FROM libro l JOIN autor a USING(id_autor) JOIN idioma i USING(id_idioma)
LEFT JOIN editorial e USING(id_editorial) LEFT JOIN resena r USING(id_libro)
GROUP BY l.id_libro;

INSERT INTO autor(id_autor,nombre,pais) VALUES (1,'Ana María',NULL),(2,'James Clear','Estados Unidos'),(3,'Homb',NULL),(4,'Yuji',NULL),(5,'Maquiavelo','Italia'),(6,'Moyang',NULL),(7,'Olivia Wilson',NULL),(8,'Martín Efrén','Colombia'),(9,'Voltaire','Francia'),(10,'Carlos Jaramillo','Colombia'),(11,'Ken Follett','Reino Unido');
INSERT INTO editorial VALUES (1,'Diana'),(2,'Salamandra'),(3,'Salamandra Infantil y Juvenil'),(4,'Salamandra Bolsillo'),(5,'Penguin Random House Grupo Editorial');
INSERT INTO idioma VALUES (1,'Español'),(2,'English');
INSERT INTO categoria VALUES (1,'Ficción y temas afines'),(2,'Infantiles, juveniles y didácticos'),(3,'Psicología'),(4,'Autoayuda'),(5,'Novela histórica'),(6,'Terror');
INSERT INTO libro(id_libro,titulo,isbn,id_autor,id_editorial,id_idioma,anio,num_paginas,encuadernacion,precio,stock,portada_url) VALUES
(1,'Crea tu portada de libro',NULL,1,2,1,2025,120,'Rústica',109000,57,NULL),
(2,'El quinto infierno',NULL,8,1,1,2025,168,'Rústica con solapas',103000,120,'https://covers.openlibrary.org/b/id/13798818-L.jpg'),
(3,'Cándido',NULL,9,4,1,2024,144,'Rústica',100000,50,'https://covers.openlibrary.org/b/id/13896467-L.jpg'),
(4,'El guardián del libro rojo',NULL,4,2,1,2024,260,'Tapa dura',200000,19,NULL),
(5,'Esperate en la alcazaba',NULL,1,2,1,2023,210,'Rústica',99999,10,NULL),
(6,'Atrae más público',NULL,2,5,1,2024,180,'Rústica',187000,50,NULL),
(7,'Cleopatra',NULL,3,5,1,2023,320,'Tapa dura',190000,1001,'https://covers.openlibrary.org/b/id/7083366-L.jpg'),
(8,'A tus pies',NULL,4,2,1,2022,190,'Rústica',103000,577,NULL),
(9,'El arte de ser nosotros',NULL,1,3,1,2025,250,'Rústica',400000,80,'https://covers.openlibrary.org/b/id/14107855-L.jpg'),
(10,'El bosque negro',NULL,2,2,1,2023,300,'Tapa dura',430000,48,'https://covers.openlibrary.org/b/id/14097086-L.jpg'),
(11,'Cleopatra la última reina',NULL,3,5,1,2022,280,'Rústica',90000,5,NULL),
(12,'La nieve interminable',NULL,4,2,1,2024,240,'Rústica',150000,99,NULL),
(13,'Hasta que el verano se acabe',NULL,1,3,1,2025,200,'Rústica',169000,500,NULL),
(14,'El dragón',NULL,2,4,1,2023,150,'Bolsillo',188000,50,NULL),
(15,'El día que se perdió la cordura',NULL,3,2,1,2024,220,'Rústica',110000,70,'https://covers.openlibrary.org/b/id/8212251-L.jpg'),
(16,'Mi portada de libro',NULL,4,2,1,2025,100,'Rústica',195000,50,NULL),
(17,'El príncipe',NULL,5,5,1,2022,140,'Rústica',990000,580,'https://covers.openlibrary.org/b/id/11417298-L.jpg'),
(18,'Hábitos atómicos','9788418118036',2,1,1,2020,333,'Rústica',900000,8950,'https://covers.openlibrary.org/b/isbn/9788418118036-L.jpg'),
(19,'El zorro en el bosque',NULL,4,3,1,2024,96,'Tapa dura',670000,5870,'/images/descarga.jpg'),
(20,'El bucle',NULL,6,2,1,2024,310,'Rústica',770000,590,'https://covers.openlibrary.org/b/id/7912495-L.jpg'),
(21,'Beast',NULL,7,5,2,2023,280,'Rústica',100000,8880,'https://covers.openlibrary.org/b/id/8212251-L.jpg');
UPDATE libro
SET portada_url = 'https://placehold.co/300x420/' ||
  CASE id_libro % 6
    WHEN 0 THEN '264653'
    WHEN 1 THEN '2f3e46'
    WHEN 2 THEN '3d405b'
    WHEN 3 THEN '5f3c35'
    WHEN 4 THEN '1d3557'
    ELSE '3a506b'
  END || '/ffffff.svg?text=' || replace(titulo, ' ', '%20')
WHERE portada_url IS NULL OR portada_url = '';
-- Portadas de ediciones coincidentes consultadas en Open Library.
UPDATE libro
SET portada_url = CASE id_libro
  WHEN 2 THEN 'https://covers.openlibrary.org/b/id/13798818-L.jpg'
  WHEN 3 THEN 'https://covers.openlibrary.org/b/id/13896467-L.jpg'
  WHEN 7 THEN 'https://covers.openlibrary.org/b/id/7083366-L.jpg'
  WHEN 9 THEN 'https://covers.openlibrary.org/b/id/14107855-L.jpg'
  WHEN 10 THEN 'https://covers.openlibrary.org/b/id/14097086-L.jpg'
  WHEN 15 THEN 'https://covers.openlibrary.org/b/id/8212251-L.jpg'
  WHEN 17 THEN 'https://covers.openlibrary.org/b/id/11417298-L.jpg'
  WHEN 20 THEN 'https://covers.openlibrary.org/b/id/7912495-L.jpg'
END
WHERE id_libro IN (2,3,7,9,10,15,17,20);
UPDATE libro
SET descuento_pct = CASE id_libro
  WHEN 2 THEN 50
  WHEN 17 THEN 30
  WHEN 20 THEN 20
  WHEN 21 THEN 80
END
WHERE id_libro IN (2,17,20,21);
UPDATE libro SET resena='El Quinto Infierno es una novela histórica que narra la vida de Lucio Cornelio Sila, uno de los personajes más poderosos y controvertidos de la antigua Roma, desde su juventud marcada por la pobreza y los excesos hasta su ascenso en la República Romana.' WHERE id_libro=2;
INSERT INTO libro_categoria VALUES (1,2),(2,3),(2,4),(2,5),(3,1),(4,1),(5,1),(6,4),(7,5),(8,1),(9,1),(10,1),(11,5),(12,1),(13,1),(14,2),(15,6),(16,1),(17,5),(18,4),(19,2),(20,1),(21,6);
INSERT INTO usuario(id_usuario,email,nombre,nombre_usuario,contrasena_hash,acepta_terminos) VALUES
(1,'jramirez12@correo.com','J. Ramírez','JRamirez12','$2b$12$hash_de_ejemplo_1',1),
(2,'marco.calderon@correo.com','Marco Calderón','MarcoCalderon','$2b$12$hash_de_ejemplo_2',1);
INSERT INTO biblioteca(id_usuario,id_libro,estado) VALUES (1,2,'favorito'),(1,3,'leyendo'),(1,7,'lista_deseos'),(1,18,'completado');
INSERT INTO metodo_pago(nombre) VALUES ('PayPal'),('Visa'),('Mastercard'),('Nequi'),('PSE'),('Davivienda'),('Bancolombia');
INSERT INTO direccion(id_direccion,id_usuario,destinatario,telefono,departamento,ciudad,direccion) VALUES (1,2,'Marco Calderón','3211234567','Atlántico','Barranquilla','Calle 1 # 2-3');
INSERT INTO pedido(id_pedido,id_usuario,id_direccion,id_metodo,subtotal,impuestos,descuento,total,estado,envio_desde,envio_hasta) VALUES (1,2,1,2,103000,19570,0,122570,'entregado','2025-11-14','2025-11-18');
INSERT INTO pedido_item VALUES (1,2,1,103000);
INSERT INTO resena(id_usuario,id_libro,calificacion,comentario,compra_verificada,fecha) VALUES (2,2,5,'Perfecta versión de la obra original',1,'2025-10-29');
INSERT INTO pregunta(id_libro,pregunta,respuesta) VALUES (2,'¿El libro es original?','Todos los libros de nuestro catálogo son originales.'),(2,'¿En qué idioma está escrito el libro?','El libro está escrito en español.'),(2,'¿Cuál es la encuadernación de este libro?','La encuadernación de esta edición es tapa dura.');
INSERT INTO seccion VALUES (1,'Destacados',1),(2,'Libros Colombia en tendencia',2),(3,'Novedades Ficción en Colombia',3);
INSERT INTO seccion_libro SELECT s.id_seccion,l.id_libro,l.id_libro FROM seccion s, libro l WHERE l.id_libro IN (17,18,2,19,20,21);
INSERT INTO autor_del_mes VALUES (10,'colombia','2025-10'),(11,'internacional','2025-10');
INSERT INTO codigo_descuento VALUES ('BIENVENIDO10',10,1);
INSERT INTO carrito(id_usuario) VALUES (1);

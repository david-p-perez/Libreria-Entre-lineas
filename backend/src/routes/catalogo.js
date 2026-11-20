const router = require('express').Router();
const db = require('../db');
const { IVA, login, lista } = require('../util');

const ORDENES = {
  precio_asc: 'v.precio_final ASC',
  precio_desc: 'v.precio_final DESC',
  calificacion: 'v.calificacion DESC',
};

const consultas = {
  librosDeInicio: db.prepare(`
    SELECT
      s.id_seccion,
      s.nombre AS nombre_seccion,
      v.*
    FROM seccion s
    LEFT JOIN seccion_libro sl USING (id_seccion)
    LEFT JOIN vista_catalogo v USING (id_libro)
    ORDER BY s.orden, sl.posicion
  `),
  autoresDelMes: db.prepare(`
    SELECT a.nombre, m.ambito
    FROM autor_del_mes m
    JOIN autor a USING (id_autor)
    ORDER BY m.ambito
  `),
};

router.get('/home', (req, res) => {
  const seccionesPorId = new Map();

  for (const fila of consultas.librosDeInicio.all()) {
    if (!seccionesPorId.has(fila.id_seccion)) {
      seccionesPorId.set(fila.id_seccion, {
        nombre: fila.nombre_seccion,
        libros: [],
      });
    }

    if (fila.id_libro !== null) {
      const libro = { ...fila };
      delete libro.id_seccion;
      delete libro.nombre_seccion;
      seccionesPorId.get(fila.id_seccion).libros.push(libro);
    }
  }

  res.json({
    secciones: [...seccionesPorId.values()],
    autores: consultas.autoresDelMes.all(),
  });
});

router.get('/filtros', (req, res) => {
  res.json({
    categorias: db.prepare('SELECT * FROM categoria').all(),
    idiomas: db.prepare('SELECT nombre FROM idioma').all(),
    editoriales: db.prepare('SELECT nombre FROM editorial').all(),
    anios: db
      .prepare('SELECT DISTINCT anio FROM libro WHERE anio IS NOT NULL ORDER BY anio DESC')
      .all()
      .map(({ anio }) => anio),
  });
});

router.get('/libros', (req, res) => {
  const { q = '', formato = '', categoria = '', orden = '', ofertas = '' } = req.query;
  const condiciones = [];
  const parametros = [];
  const busqueda = String(q).trim();

  if (busqueda) {
    condiciones.push('(v.titulo LIKE ? OR v.autor LIKE ? OR l.isbn LIKE ?)');
    parametros.push(...Array(3).fill(`%${busqueda}%`));
  }

  if (['fisico', 'digital'].includes(formato)) {
    condiciones.push('v.formato = ?');
    parametros.push(formato);
  }

  if (String(ofertas) === '1') {
    condiciones.push('v.descuento_pct > 0');
  }

  if (/^\d+$/.test(categoria)) {
    condiciones.push(`v.id_libro IN (
      SELECT id_libro FROM libro_categoria WHERE id_categoria = ?
    )`);
    parametros.push(Number(categoria));
  }

  for (const [columna, clave] of [
    ['v.idioma', 'idioma'],
    ['v.editorial', 'editorial'],
    ['v.anio', 'anio'],
  ]) {
    const valores = lista(req.query[clave]);

    if (valores.length) {
      condiciones.push(`${columna} IN (${valores.map(() => '?').join(', ')})`);
      parametros.push(...valores);
    }
  }

  const where = condiciones.length ? condiciones.join(' AND ') : '1 = 1';
  const orderBy = ORDENES[orden] || 'v.num_resenas DESC, v.titulo';
  const libros = db
    .prepare(`
      SELECT v.*
      FROM vista_catalogo v
      JOIN libro l USING (id_libro)
      WHERE ${where}
      ORDER BY ${orderBy}
    `)
    .all(...parametros);

  res.json(libros);
});

router.get('/libros/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identificador de libro no válido.' });
  }

  const libro = db
    .prepare(`
      SELECT
        l.*,
        ROUND(l.precio * (100 - l.descuento_pct) / 100.0) AS precio_final,
        a.nombre AS autor,
        e.nombre AS editorial,
        i.nombre AS idioma,
        (
          SELECT group_concat(c.nombre, ' | ')
          FROM libro_categoria lc
          JOIN categoria c USING (id_categoria)
          WHERE lc.id_libro = l.id_libro
        ) AS categorias
      FROM libro l
      JOIN autor a USING (id_autor)
      LEFT JOIN editorial e USING (id_editorial)
      JOIN idioma i USING (id_idioma)
      WHERE l.id_libro = ?
    `)
    .get(id);

  if (!libro) return res.status(404).json({ error: 'Libro no encontrado.' });

  libro.impuestos = Math.round(libro.precio_final * IVA);

  const resenas = db
    .prepare(`
      SELECT
        r.id_resena, r.calificacion, r.comentario, r.compra_verificada,
        r.fecha, u.nombre,
        (SELECT COUNT(*) FROM voto_resena WHERE id_resena = r.id_resena AND es_util = 1) AS utiles,
        (SELECT COUNT(*) FROM voto_resena WHERE id_resena = r.id_resena AND es_util = 0) AS no_utiles
      FROM resena r
      JOIN usuario u USING (id_usuario)
      WHERE r.id_libro = ?
      ORDER BY r.fecha DESC, r.id_resena DESC
    `)
    .all(id);

  const preguntas = db
    .prepare('SELECT pregunta, respuesta FROM pregunta WHERE id_libro = ?')
    .all(id);

  const mios = req.session.uid
    ? db
        .prepare('SELECT estado FROM biblioteca WHERE id_usuario = ? AND id_libro = ?')
        .all(req.session.uid, id)
        .map(({ estado }) => estado)
    : [];

  res.json({ libro, resenas, preguntas, mios });
});

router.post('/libros/:id/resenas', login, (req, res) => {
  const id = Number(req.params.id);
  const calificacion = Number(req.body.calificacion);
  const uid = req.session.uid;

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identificador de libro no válido.' });
  }

  if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ error: 'La calificación debe ser de 1 a 5.' });
  }

  if (!db.prepare('SELECT 1 FROM libro WHERE id_libro = ?').get(id)) {
    return res.status(404).json({ error: 'Libro no encontrado.' });
  }

  const compraVerificada = Boolean(
    db.prepare(`
      SELECT 1
      FROM pedido p
      JOIN pedido_item i USING (id_pedido)
      WHERE p.id_usuario = ? AND i.id_libro = ?
    `).get(uid, id),
  );

  db.prepare(`
    INSERT INTO resena (id_usuario, id_libro, calificacion, comentario, compra_verificada)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (id_usuario, id_libro) DO UPDATE SET
      calificacion = excluded.calificacion,
      comentario = excluded.comentario
  `).run(
    uid,
    id,
    calificacion,
    String(req.body.comentario || '').slice(0, 1000),
    Number(compraVerificada),
  );

  res.status(201).json({ ok: true });
});

router.post('/resenas/:id/voto', login, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identificador de reseña no válido.' });
  }

  if (!db.prepare('SELECT 1 FROM resena WHERE id_resena = ?').get(id)) {
    return res.status(404).json({ error: 'Reseña no encontrada.' });
  }

  db.prepare('INSERT OR REPLACE INTO voto_resena VALUES (?, ?, ?)').run(
    id,
    req.session.uid,
    req.body.es_util ? 1 : 0,
  );

  res.json({ ok: true });
});

module.exports = router;

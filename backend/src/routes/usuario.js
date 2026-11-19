const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { ESTADOS_BIBLIOTECA, login } = require('../util');

function usuarioPublico(usuario) {
  return {
    id: usuario.id_usuario,
    nombre: usuario.nombre,
    email: usuario.email,
  };
}

function iniciarSesion(req, res, next, usuario, statusCode = 200) {
  req.session.regenerate((error) => {
    if (error) return next(error);

    req.session.uid = usuario.id;
    res.status(statusCode).json({ usuario });
  });
}

router.get('/auth/yo', (req, res) => {
  const usuario = req.session.uid
    ? db.prepare('SELECT * FROM usuario WHERE id_usuario = ?').get(req.session.uid)
    : null;

  res.json({ usuario: usuario ? usuarioPublico(usuario) : null });
});

router.post('/auth/registro', (req, res, next) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const nombre = String(req.body.nombre || '').trim();
  const contrasena = String(req.body.contrasena || '');

  const correoValido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const contrasenaValida = contrasena.length >= 6 && /[A-Z]/.test(contrasena);
  const correoRegistrado = db
    .prepare('SELECT 1 FROM usuario WHERE email = ?')
    .get(email);

  const error = !correoValido
    ? 'Correo no válido.'
    : !nombre
      ? 'El nombre es obligatorio.'
      : !contrasenaValida
        ? 'La contraseña debe tener mínimo 6 caracteres y una mayúscula.'
        : !req.body.terminos
          ? 'Debes aceptar los términos y condiciones.'
          : correoRegistrado
            ? 'Ese correo ya está registrado.'
            : null;

  if (error) return res.status(400).json({ error });

  const resultado = db
    .prepare(`
      INSERT INTO usuario (email, nombre, contrasena_hash, acepta_terminos)
      VALUES (?, ?, ?, 1)
    `)
    .run(email, nombre, bcrypt.hashSync(contrasena, 10));

  iniciarSesion(
    req,
    res,
    next,
    { id: Number(resultado.lastInsertRowid), nombre, email },
    201,
  );
});

router.post('/auth/login', (req, res, next) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const contrasena = String(req.body.contrasena || '');
  const usuario = db.prepare('SELECT * FROM usuario WHERE email = ?').get(email);

  if (
    !usuario ||
    !usuario.contrasena_hash ||
    !bcrypt.compareSync(contrasena, usuario.contrasena_hash)
  ) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }

  iniciarSesion(req, res, next, usuarioPublico(usuario));
});

router.post('/auth/salir', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/biblioteca', login, (req, res) => {
  const estado = ESTADOS_BIBLIOTECA.includes(req.query.estado)
    ? req.query.estado
    : null;

  const filtroEstado = estado ? 'AND b.estado = ?' : '';
  const parametros = estado ? [req.session.uid, estado] : [req.session.uid];

  const libros = db
    .prepare(`
      SELECT DISTINCT v.*
      FROM vista_catalogo v
      JOIN biblioteca b USING (id_libro)
      WHERE b.id_usuario = ? ${filtroEstado}
      ORDER BY v.titulo
    `)
    .all(...parametros);

  res.json(libros);
});

router.post('/biblioteca/:id/:estado', login, (req, res) => {
  const id = Number(req.params.id);
  const estado = req.params.estado;

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identificador de libro no válido.' });
  }

  if (!ESTADOS_BIBLIOTECA.includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido.' });
  }

  if (!db.prepare('SELECT 1 FROM libro WHERE id_libro = ?').get(id)) {
    return res.status(404).json({ error: 'Libro no encontrado.' });
  }

  const parametros = [req.session.uid, id, estado];
  const existente = db
    .prepare(`
      SELECT 1
      FROM biblioteca
      WHERE id_usuario = ? AND id_libro = ? AND estado = ?
    `)
    .get(...parametros);

  if (existente) {
    db.prepare(`
      DELETE FROM biblioteca
      WHERE id_usuario = ? AND id_libro = ? AND estado = ?
    `).run(...parametros);
  } else {
    db.prepare(`
      INSERT INTO biblioteca (id_usuario, id_libro, estado)
      VALUES (?, ?, ?)
    `).run(...parametros);
  }

  res.json({ activo: !existente });
});

module.exports = router;

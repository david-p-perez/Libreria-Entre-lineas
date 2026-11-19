const r = require('express').Router(), bcrypt = require('bcryptjs'), db = require('../db'), { login } = require('../util');
const ESTADOS = ['favorito', 'leyendo', 'lista_deseos', 'completado'];
const pub = u => ({ id: u.id_usuario, nombre: u.nombre, email: u.email });
const entrar = (req, res, next, u, code = 200) => req.session.regenerate(e => {
  if (e) return next(e); req.session.uid = u.id; res.status(code).json({ usuario: u }); });

r.get('/auth/yo', (req, res) => {
  const u = req.session.uid && db.prepare('select * from usuario where id_usuario=?').get(req.session.uid);
  res.json({ usuario: u ? pub(u) : null });
});

r.post('/auth/registro', (req, res, next) => {
  const email = String(req.body.email || '').trim().toLowerCase(), nombre = String(req.body.nombre || '').trim(), clave = String(req.body.contrasena || '');
  const err = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? 'Correo no válido.' : !nombre ? 'El nombre es obligatorio.'
    : clave.length < 6 || !/[A-Z]/.test(clave) ? 'La contraseña debe tener mínimo 6 caracteres y una mayúscula.'
    : !req.body.terminos ? 'Debes aceptar los términos y condiciones.'
    : db.prepare('select 1 from usuario where email=?').get(email) ? 'Ese correo ya está registrado.' : null;
  if (err) return res.status(400).json({ error: err });
  const id = db.prepare('insert into usuario(email,nombre,contrasena_hash,acepta_terminos) values(?,?,?,1)').run(email, nombre, bcrypt.hashSync(clave, 10)).lastInsertRowid;
  entrar(req, res, next, { id: Number(id), nombre, email }, 201);
});

r.post('/auth/login', (req, res, next) => {
  const u = db.prepare('select * from usuario where email=?').get(String(req.body.email || '').trim().toLowerCase());
  if (!u || !u.contrasena_hash || !bcrypt.compareSync(String(req.body.contrasena || ''), u.contrasena_hash))
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  entrar(req, res, next, pub(u));
});

r.post('/auth/salir', (req, res) => req.session.destroy(() => res.json({ ok: true })));

r.get('/biblioteca', login, (req, res) => {
  const est = ESTADOS.includes(req.query.estado) ? req.query.estado : null;
  res.json(db.prepare(`select distinct v.* from vista_catalogo v join biblioteca b using(id_libro) where b.id_usuario=? ${est ? 'and b.estado=?' : ''}`)
    .all(...[req.session.uid, est].filter(Boolean)));
});

r.post('/biblioteca/:id/:estado', login, (req, res) => {
  const id = +req.params.id, estado = req.params.estado, k = [req.session.uid, id, estado];
  if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado no válido.' });
  if (!db.prepare('select 1 from libro where id_libro=?').get(id)) return res.status(404).json({ error: 'Libro no encontrado.' });
  const hay = db.prepare('select 1 from biblioteca where id_usuario=? and id_libro=? and estado=?').get(...k);
  hay ? db.prepare('delete from biblioteca where id_usuario=? and id_libro=? and estado=?').run(...k)
      : db.prepare('insert into biblioteca(id_usuario,id_libro,estado) values(?,?,?)').run(...k);
  res.json({ activo: !hay });
});
module.exports = r;

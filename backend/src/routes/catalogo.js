const r = require('express').Router(), db = require('../db'), { IVA, login, lista } = require('../util');
const ORDEN = { precio_asc: 'v.precio asc', precio_desc: 'v.precio desc', calificacion: 'v.calificacion desc' };

r.get('/home', (req, res) => {
  const secciones = db.prepare('select * from seccion order by orden').all().map(s => ({ nombre: s.nombre,
    libros: db.prepare('select v.* from vista_catalogo v join seccion_libro sl using(id_libro) where sl.id_seccion=? order by sl.posicion').all(s.id_seccion) }));
  const autores = db.prepare('select a.nombre, m.ambito from autor_del_mes m join autor a using(id_autor) order by m.ambito').all();
  res.json({ secciones, autores });
});

r.get('/filtros', (req, res) => res.json({
  categorias: db.prepare('select * from categoria').all(), idiomas: db.prepare('select nombre from idioma').all(),
  editoriales: db.prepare('select nombre from editorial').all(),
  anios: db.prepare('select distinct anio from libro where anio is not null order by anio desc').all().map(x => x.anio) }));

r.get('/libros', (req, res) => {
  const { q = '', formato = '', categoria = '', orden = '' } = req.query, w = ['1=1'], p = [];
  if (String(q).trim()) { w.push('(v.titulo like ? or v.autor like ? or l.isbn like ?)'); p.push(...Array(3).fill(`%${String(q).trim()}%`)); }
  if (['fisico', 'digital'].includes(formato)) { w.push('v.formato=?'); p.push(formato); }
  if (/^\d+$/.test(categoria)) { w.push('v.id_libro in (select id_libro from libro_categoria where id_categoria=?)'); p.push(+categoria); }
  for (const [col, key] of [['v.idioma', 'idioma'], ['v.editorial', 'editorial'], ['v.anio', 'anio']]) {
    const vals = lista(req.query[key]); if (vals.length) { w.push(`${col} in (${vals.map(() => '?').join(',')})`); p.push(...vals); }
  }
  const o = ORDEN[orden] || 'v.num_resenas desc, v.titulo';
  res.json(db.prepare(`select v.* from vista_catalogo v join libro l using(id_libro) where ${w.join(' and ')} order by ${o}`).all(...p));
});

r.get('/libros/:id', (req, res) => {
  const id = +req.params.id;
  const libro = db.prepare(`select l.*, a.nombre autor, e.nombre editorial, i.nombre idioma,
    (select group_concat(c.nombre,' | ') from libro_categoria lc join categoria c using(id_categoria) where lc.id_libro=l.id_libro) categorias
    from libro l join autor a using(id_autor) left join editorial e using(id_editorial) join idioma i using(id_idioma) where l.id_libro=?`).get(id);
  if (!libro) return res.status(404).json({ error: 'Libro no encontrado.' });
  libro.impuestos = Math.round(libro.precio * IVA);
  const resenas = db.prepare(`select r.id_resena, r.calificacion, r.comentario, r.compra_verificada, r.fecha, u.nombre,
    (select count(*) from voto_resena where id_resena=r.id_resena and es_util=1) utiles,
    (select count(*) from voto_resena where id_resena=r.id_resena and es_util=0) no_utiles
    from resena r join usuario u using(id_usuario) where r.id_libro=? order by r.fecha desc, r.id_resena desc`).all(id);
  const preguntas = db.prepare('select pregunta, respuesta from pregunta where id_libro=?').all(id);
  const mios = req.session.uid ? db.prepare('select estado from biblioteca where id_usuario=? and id_libro=?').all(req.session.uid, id).map(x => x.estado) : [];
  res.json({ libro, resenas, preguntas, mios });
});

r.post('/libros/:id/resenas', login, (req, res) => {
  const id = +req.params.id, cal = +req.body.calificacion, uid = req.session.uid;
  if (!(cal >= 1 && cal <= 5)) return res.status(400).json({ error: 'La calificación debe ser de 1 a 5.' });
  if (!db.prepare('select 1 from libro where id_libro=?').get(id)) return res.status(404).json({ error: 'Libro no encontrado.' });
  const ver = !!db.prepare('select 1 from pedido p join pedido_item i using(id_pedido) where p.id_usuario=? and i.id_libro=?').get(uid, id);
  db.prepare(`insert into resena(id_usuario,id_libro,calificacion,comentario,compra_verificada) values(?,?,?,?,?)
    on conflict(id_usuario,id_libro) do update set calificacion=excluded.calificacion, comentario=excluded.comentario`)
    .run(uid, id, cal, String(req.body.comentario || '').slice(0, 1000), +ver);
  res.status(201).json({ ok: true });
});

r.post('/resenas/:id/voto', login, (req, res) => {
  if (!db.prepare('select 1 from resena where id_resena=?').get(+req.params.id)) return res.status(404).json({ error: 'Reseña no encontrada.' });
  db.prepare('insert or replace into voto_resena values(?,?,?)').run(+req.params.id, req.session.uid, req.body.es_util ? 1 : 0);
  res.json({ ok: true });
});
module.exports = r;

const r = require('express').Router(), db = require('../db'), { IVA, login } = require('../util');
const filas = uid => db.prepare(`select l.id_libro, l.titulo, l.precio, l.stock, ci.cantidad from carrito_item ci
  join carrito c using(id_carrito) join libro l using(id_libro) where c.id_usuario=?`).all(uid);
const carritoId = uid => { db.prepare('insert or ignore into carrito(id_usuario) values(?)').run(uid);
  return db.prepare('select id_carrito from carrito where id_usuario=?').get(uid).id_carrito; };
function totales(items, codigo) {
  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const c = codigo && db.prepare('select * from codigo_descuento where codigo=? and activo=1').get(String(codigo).toUpperCase());
  const descuento = c ? Math.round(subtotal * c.porcentaje / 100) : 0, impuestos = Math.round((subtotal - descuento) * IVA);
  return { subtotal, descuento, impuestos, total: subtotal - descuento + impuestos, codigo: c ? c.codigo : null };
}

r.get('/metodos-pago', (req, res) => res.json(db.prepare('select * from metodo_pago').all()));

r.get('/carrito', login, (req, res) => {
  const items = filas(req.session.uid), cod = req.query.codigo || '', t = totales(items, cod);
  res.json({ items, ...t, codigo_valido: !cod || !!t.codigo });
});

r.post('/carrito/:id', login, (req, res) => {
  const id = +req.params.id, cant = Math.max(1, parseInt(req.body.cantidad) || 1), l = db.prepare('select stock from libro where id_libro=?').get(id);
  if (!l) return res.status(404).json({ error: 'Libro no encontrado.' });
  const cid = carritoId(req.session.uid), ya = db.prepare('select cantidad from carrito_item where id_carrito=? and id_libro=?').get(cid, id)?.cantidad || 0;
  if (ya + cant > l.stock) return res.status(400).json({ error: `Solo quedan ${l.stock} unidades.` });
  db.prepare(`insert into carrito_item values(?,?,?) on conflict(id_carrito,id_libro) do update set cantidad=excluded.cantidad`).run(cid, id, ya + cant);
  res.status(201).json({ ok: true });
});

r.delete('/carrito/:id', login, (req, res) => {
  db.prepare('delete from carrito_item where id_carrito=? and id_libro=?').run(carritoId(req.session.uid), +req.params.id);
  res.json({ ok: true });
});

r.post('/pedidos', login, (req, res) => {
  const b = req.body, uid = req.session.uid;
  for (const k of ['destinatario', 'telefono', 'departamento', 'ciudad', 'direccion'])
    if (!String(b[k] || '').trim()) return res.status(400).json({ error: 'Completa todos los datos de envío.' });
  if (!db.prepare('select 1 from metodo_pago where id_metodo=?').get(+b.id_metodo)) return res.status(400).json({ error: 'Elige un método de pago.' });
  const items = filas(uid);
  if (!items.length) return res.status(400).json({ error: 'Tu cesta está vacía.' });
  const sin = items.find(i => i.cantidad > i.stock);
  if (sin) return res.status(400).json({ error: `No hay stock suficiente de "${sin.titulo}".` });
  const t = totales(items, b.codigo);
  const crear = db.transaction(() => {
    const dir = db.prepare('insert into direccion(id_usuario,destinatario,telefono,departamento,ciudad,direccion) values(?,?,?,?,?,?)')
      .run(uid, b.destinatario, b.telefono, b.departamento, b.ciudad, b.direccion).lastInsertRowid;
    const id = db.prepare(`insert into pedido(id_usuario,id_direccion,id_metodo,codigo,subtotal,impuestos,descuento,total,estado,envio_desde,envio_hasta)
      values(?,?,?,?,?,?,?,?,'pagado',date('now','+2 day'),date('now','+5 day'))`).run(uid, dir, +b.id_metodo, t.codigo, t.subtotal, t.impuestos, t.descuento, t.total).lastInsertRowid;
    for (const i of items) {
      db.prepare('insert into pedido_item values(?,?,?,?)').run(id, i.id_libro, i.cantidad, i.precio);
      db.prepare('update libro set stock=stock-? where id_libro=?').run(i.cantidad, i.id_libro);
    }
    db.prepare('delete from carrito_item where id_carrito=?').run(carritoId(uid));
    return Number(id);
  });
  res.status(201).json({ id_pedido: crear(), total: t.total });
});

r.get('/pedidos', login, (req, res) => res.json(db.prepare('select * from pedido where id_usuario=? order by creado_en desc').all(req.session.uid)));
module.exports = r;

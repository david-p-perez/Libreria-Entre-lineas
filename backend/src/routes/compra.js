const router = require('express').Router();
const db = require('../db');
const { IVA, login } = require('../util');

const consultaCarrito = db.prepare(`
  SELECT l.id_libro, l.titulo, l.precio, l.stock, ci.cantidad
  FROM carrito_item ci
  JOIN carrito c USING (id_carrito)
  JOIN libro l USING (id_libro)
  WHERE c.id_usuario = ?
`);

const consultaCarritoId = db.prepare(
  'SELECT id_carrito FROM carrito WHERE id_usuario = ?',
);
const crearCarrito = db.prepare(
  'INSERT OR IGNORE INTO carrito (id_usuario) VALUES (?)',
);

function obtenerItems(uid) {
  return consultaCarrito.all(uid);
}

function obtenerCarritoId(uid) {
  crearCarrito.run(uid);
  return consultaCarritoId.get(uid).id_carrito;
}

function calcularTotales(items, codigo) {
  const subtotal = items.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0,
  );

  const descuentoActivo = codigo
    ? db
        .prepare('SELECT * FROM codigo_descuento WHERE codigo = ? AND activo = 1')
        .get(String(codigo).trim().toUpperCase())
    : null;

  const descuento = descuentoActivo
    ? Math.round((subtotal * descuentoActivo.porcentaje) / 100)
    : 0;
  const impuestos = Math.round((subtotal - descuento) * IVA);

  return {
    subtotal,
    descuento,
    impuestos,
    total: subtotal - descuento + impuestos,
    codigo: descuentoActivo ? descuentoActivo.codigo : null,
  };
}

router.get('/metodos-pago', (req, res) => {
  res.json(db.prepare('SELECT * FROM metodo_pago').all());
});

router.get('/carrito', login, (req, res) => {
  const items = obtenerItems(req.session.uid);
  const codigo = req.query.codigo || '';
  const totales = calcularTotales(items, codigo);

  res.json({
    items,
    ...totales,
    codigo_valido: !codigo || Boolean(totales.codigo),
  });
});

router.post('/carrito/:id', login, (req, res) => {
  const id = Number(req.params.id);
  const cantidadSolicitada = Number.parseInt(req.body.cantidad, 10);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identificador de libro no válido.' });
  }

  const cantidad = Number.isInteger(cantidadSolicitada) && cantidadSolicitada > 0
    ? cantidadSolicitada
    : 1;
  const libro = db
    .prepare('SELECT stock FROM libro WHERE id_libro = ?')
    .get(id);

  if (!libro) return res.status(404).json({ error: 'Libro no encontrado.' });

  const carritoId = obtenerCarritoId(req.session.uid);
  const itemExistente = db
    .prepare(`
      SELECT cantidad
      FROM carrito_item
      WHERE id_carrito = ? AND id_libro = ?
    `)
    .get(carritoId, id);
  const cantidadActual = itemExistente ? itemExistente.cantidad : 0;

  if (cantidadActual + cantidad > libro.stock) {
    return res.status(400).json({
      error: `Solo quedan ${libro.stock} unidades.`,
    });
  }

  db.prepare(`
    INSERT INTO carrito_item (id_carrito, id_libro, cantidad)
    VALUES (?, ?, ?)
    ON CONFLICT (id_carrito, id_libro)
    DO UPDATE SET cantidad = excluded.cantidad
  `).run(carritoId, id, cantidadActual + cantidad);

  res.status(201).json({ ok: true });
});

router.delete('/carrito/:id', login, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identificador de libro no válido.' });
  }

  db.prepare(`
    DELETE FROM carrito_item
    WHERE id_carrito = ? AND id_libro = ?
  `).run(obtenerCarritoId(req.session.uid), id);

  res.json({ ok: true });
});

router.post('/pedidos', login, (req, res) => {
  const datos = req.body;
  const uid = req.session.uid;
  const camposEnvio = [
    'destinatario',
    'telefono',
    'departamento',
    'ciudad',
    'direccion',
  ];

  const envioIncompleto = camposEnvio.some(
    (campo) => !String(datos[campo] || '').trim(),
  );

  if (envioIncompleto) {
    return res.status(400).json({
      error: 'Completa todos los datos de envío.',
    });
  }

  const metodoPagoId = Number(datos.id_metodo);
  if (
    !Number.isInteger(metodoPagoId) ||
    !db.prepare('SELECT 1 FROM metodo_pago WHERE id_metodo = ?').get(metodoPagoId)
  ) {
    return res.status(400).json({ error: 'Elige un método de pago.' });
  }

  const items = obtenerItems(uid);
  if (!items.length) {
    return res.status(400).json({ error: 'Tu cesta está vacía.' });
  }

  const itemSinStock = items.find((item) => item.cantidad > item.stock);
  if (itemSinStock) {
    return res.status(400).json({
      error: `No hay stock suficiente de "${itemSinStock.titulo}".`,
    });
  }

  const totales = calcularTotales(items, datos.codigo);
  const carritoId = obtenerCarritoId(uid);

  const crearPedido = db.transaction(() => {
    const direccionId = db
      .prepare(`
        INSERT INTO direccion (
          id_usuario, destinatario, telefono, departamento, ciudad, direccion
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        uid,
        ...camposEnvio.map((campo) => String(datos[campo]).trim()),
      ).lastInsertRowid;

    const pedidoId = db
      .prepare(`
        INSERT INTO pedido (
          id_usuario, id_direccion, id_metodo, codigo, subtotal,
          impuestos, descuento, total, estado, envio_desde, envio_hasta
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pagado', date('now', '+2 day'), date('now', '+5 day'))
      `)
      .run(
        uid,
        direccionId,
        metodoPagoId,
        totales.codigo,
        totales.subtotal,
        totales.impuestos,
        totales.descuento,
        totales.total,
      ).lastInsertRowid;

    const insertarItem = db.prepare(`
      INSERT INTO pedido_item (id_pedido, id_libro, cantidad, precio_unitario)
      VALUES (?, ?, ?, ?)
    `);
    const actualizarStock = db.prepare(`
      UPDATE libro
      SET stock = stock - ?
      WHERE id_libro = ? AND stock >= ?
    `);

    for (const item of items) {
      insertarItem.run(pedidoId, item.id_libro, item.cantidad, item.precio);

      const resultadoStock = actualizarStock.run(
        item.cantidad,
        item.id_libro,
        item.cantidad,
      );

      if (resultadoStock.changes !== 1) {
        throw new Error(`Stock insuficiente para "${item.titulo}".`);
      }
    }

    db.prepare('DELETE FROM carrito_item WHERE id_carrito = ?').run(carritoId);

    return Number(pedidoId);
  });

  try {
    const idPedido = crearPedido();
    res.status(201).json({ id_pedido: idPedido, total: totales.total });
  } catch (error) {
    if (error.message.startsWith('Stock insuficiente')) {
      return res.status(409).json({ error: error.message });
    }

    throw error;
  }
});

router.get('/pedidos', login, (req, res) => {
  const pedidos = db
    .prepare(`
      SELECT *
      FROM pedido
      WHERE id_usuario = ?
      ORDER BY creado_en DESC
    `)
    .all(req.session.uid);

  res.json(pedidos);
});

module.exports = router;

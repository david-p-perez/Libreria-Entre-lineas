const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cop = n => '$ ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const stars = n => { n = Math.round(n || 0); return '★'.repeat(n) + '<i>' + '★'.repeat(5 - n) + '</i>'; };
const qs = () => new URLSearchParams(location.search);
const precioVisible = libro => libro.descuento_pct
  ? `<span class="precio-rebajado"><del>${cop(libro.precio)}</del><b>${cop(libro.precio_final)}</b></span>`
  : cop(libro.precio_final ?? libro.precio);
async function api(url, o = {}) {
  const r = await fetch('/api' + url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...o, body: o.body ? JSON.stringify(o.body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'Error inesperado'), { status: r.status });
  return d;
}
const run = async f => { try { await f(); } catch (e) { e.status === 401 ? location = 'acceso.html?modo=login' : alert(e.message); } };
const card = b => `<a class="card" href="producto.html?id=${b.id_libro}"><div class="cover" style="--h:${b.id_libro * 47 % 360}">${b.portada_url
  ? `<img src="${esc(b.portada_url)}" alt="${esc(b.titulo)}" loading="lazy" onerror="this.replaceWith(this.alt)">` : esc(b.titulo)}${b.descuento_pct ? `<span class="discount-badge">-${b.descuento_pct}%</span>` : ''}</div><div class="i">${esc(b.titulo)}<br>Por: ${esc(b.autor)}<br><span class="s">${stars(b.calificacion)}</span><small><span>${b.stock} unidades</span><span class="card-price">${precioVisible(b)}</span></small></div></a>`;
const WHY = `<section class="why"><h2>¿Por qué Entre Líneas?</h2><div><p><b>Soporte 24/7</b>Estamos aquí para ayudarte siempre</p><p><b>Calidad garantizada</b>Solo los mejores títulos seleccionados</p><p><b>Envío rápido</b>Entregas en 24-48 horas a todo el país</p><p><b>Pago seguro</b>Múltiples métodos de pago confiables</p></div></section>`;
const FOOT = `<footer><div><h3>Conócenos</h3><a href="#">Blog</a><a href="#">Acerca de nosotros</a></div><div><h3>Contáctanos</h3><p>3211234567</p><a href="mailto:EntreLineas@book.com">EntreLineas@book.com</a></div><div><h3>Redes sociales</h3><a href="#">Entre_Lineas</a><a href="#">Entre_Lineas</a></div></footer>`;

function chrome(u, pg) {
  $('#hdr').innerHTML = `<input type="checkbox" id="m"><label for="m" class="ico" aria-label="Abrir menú">☰</label><label for="m" class="ov"></label>
  <nav class="side" aria-label="Menú"><label for="m" class="x">✕</label><strong>${u ? esc(u.nombre) : 'Invitado'}</strong>
  ${u ? `<a href="biblioteca.html?estado=favorito">Favoritos</a><a href="biblioteca.html">Biblioteca</a> <a href="#" id="salir">Cerrar sesión</a>`
      : `<a href="acceso.html?modo=login">Iniciar sesión</a><a href="acceso.html">Crear cuenta</a>`}<a href="index.html">Inicio</a><a href="carrito.html">Cesta</a></nav>
  <form action="catalogo.html" role="search"><input type="search" name="q" value="${esc(qs().get('q') || '')}" placeholder="Título, autor o ISBN" aria-label="Buscar"><button aria-label="Buscar">🔍</button></form>
  <a href="index.html" class="logo">Entre<b>Líneas</b></a>`;
  $('#pie').innerHTML = (['carrito', 'acceso'].includes(pg) ? '' : WHY) + FOOT;
  const s = $('#salir'); if (s) s.onclick = e => { e.preventDefault(); api('/auth/salir', { method: 'POST' }).then(() => location = 'index.html'); };
  const a = sessionStorage.getItem('aviso');
  if (a) { $('#av').innerHTML = `<p class="flash" style="max-width:1200px;margin:12px auto">${esc(a)}</p>`; sessionStorage.removeItem('aviso'); }
}

const pages = {};
const CATS = `<div class="cats"><a href="catalogo.html?categoria=1"><span></span>Cada historia cuenta<b>Ver libros</b></a><a href="catalogo.html?categoria=2"><span style="background:linear-gradient(#f6a38a,#6b8fb3)"></span>Nos conocimos en el mar<b>Ver más</b></a><a href="catalogo.html?categoria=6"><span style="background:#400"></span>Historias de terror<b>Ver más</b></a></div>`;
pages.index = async () => {
  const d = await api('/home');
  $('#main').innerHTML = `<div class="promo"><div><small>OFERTAS EN LIBROS SELECCIONADOS</small><p>Hasta <strong>80%</strong> de descuento</p><a class="btn" href="catalogo.html?ofertas=1">Ver ofertas</a></div></div>`
    + d.secciones.map((s, i) => `<section class="band"><span class="tag">${esc(s.nombre)}</span><div class="row">${s.libros.map(card).join('')}</div></section>${i === 1 ? CATS : ''}`).join('')
    + `<div class="cats">${d.autores.map(a => `<div class="autor"><i></i><div><h3>${esc(a.nombre)}, nuestro autor del mes ${a.ambito === 'colombia' ? 'Colombia' : 'internacional'}</h3><p><a class="btn p" href="catalogo.html?q=${encodeURIComponent(a.nombre)}">Saber más</a></p></div></div>`).join('')}</div>`;
};

pages.catalogo = async () => {
  const f = await api('/filtros'), p = qs(), chk = (k, v) => p.getAll(k).includes(String(v)) ? 'checked' : '';
  const grupo = (t, k, vals) => `<h3>${t}</h3>` + vals.map(v => `<label><input type="checkbox" name="${k}" value="${esc(v)}" ${chk(k, v)}> ${esc(v)}</label>`).join('');
  const ord = p.get('orden') || '';
  const soloOfertas = p.get('ofertas') === '1';
  $('#main').innerHTML = `<form class="cat" id="ff"><input type="hidden" name="q" value="${esc(p.get('q') || '')}"><input type="hidden" name="ofertas" value="${soloOfertas ? '1' : ''}"><aside class="filtros"><h3>CATEGORÍA:</h3>
    <label><input type="radio" name="categoria" value="" ${p.get('categoria') ? '' : 'checked'}> Todas</label>
    ${f.categorias.map(c => `<label><input type="radio" name="categoria" value="${c.id_categoria}" ${chk('categoria', c.id_categoria)}> ${esc(c.nombre)}</label>`).join('')}
    ${grupo('IDIOMA:', 'idioma', f.idiomas.map(x => x.nombre))}${grupo('EDITORIAL:', 'editorial', f.editoriales.map(x => x.nombre))}${grupo('AÑO:', 'anio', f.anios)}
    <button class="btn" style="margin-top:12px;width:100%">Aplicar filtros</button></aside>
    <div><div class="bar">${soloOfertas ? '<strong class="offer-label">Ofertas en libros seleccionados</strong>' : 'Ver:'} <button name="formato" value="fisico">Libros físicos</button><button name="formato" value="digital">Libros digitales</button><button name="formato" value="">Todos los libros</button>
    <select name="orden" aria-label="Ordenar por">${[['', 'Relevancia'], ['precio_asc', 'Menor precio'], ['precio_desc', 'Mayor precio'], ['calificacion', 'Mejor calificados']].map(([v, t]) => `<option value="${v}" ${ord === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div><div id="res"></div></div></form>`;
  const form = $('#ff');
  const cargar = async params => {
    history.replaceState(null, '', '?' + params);
    const libros = await api('/libros?' + params);
    $('#res').innerHTML = libros.length ? `<div class="band row">${libros.map(card).join('')}</div>` : '<p class="panel">No encontramos libros con esos filtros.</p>';
  };
  const leer = sub => { const q = new URLSearchParams(); for (const [k, v] of new FormData(form, sub)) if (v) q.append(k, v); return q; };
  form.onsubmit = e => { e.preventDefault(); cargar(leer(e.submitter)); };
  form.orden.onchange = () => form.requestSubmit();
  await cargar(p);
};

pages.producto = async u => {
  const id = qs().get('id'), { libro: l, resenas: rs, preguntas, mios } = await api('/libros/' + id);
  document.title = l.titulo + ' | EntreLíneas';
  const dist = [5, 4, 3, 2, 1].map(n => { const c = rs.filter(r => r.calificacion === n).length; return [n, c, rs.length ? Math.round(100 * c / rs.length) : 0]; });
  const ESTS = [['lista_deseos', 'Agregar a lista de deseos'], ['favorito', 'Marcar como favorito'], ['leyendo', 'Lo estoy leyendo'], ['completado', 'Ya lo leí']];
  const cover = `<div class="cover" style="--h:${l.id_libro * 47 % 360};border-radius:10px">${l.portada_url ? `<img src="${esc(l.portada_url)}" alt="${esc(l.titulo)}" onerror="this.replaceWith(this.alt)">` : esc(l.titulo)}${l.descuento_pct ? `<span class="discount-badge">-${l.descuento_pct}%</span>` : ''}</div>`;
  $('#main').innerHTML = `<div class="prod"><aside class="panel ficha">${cover}<dl><dt>Formato</dt><dd>${l.formato === 'fisico' ? 'Libro físico' : 'Libro digital'}</dd><dt>Editorial</dt><dd class="a">${esc(l.editorial || '—')}</dd><dt>Autor</dt><dd class="a">${esc(l.autor)}</dd><dt>Categoría</dt><dd>${esc(l.categorias || '—')}</dd><dt>Año</dt><dd>${l.anio || '—'}</dd><dt>Idioma</dt><dd>${esc(l.idioma)}</dd><dt>N.° páginas</dt><dd>${l.num_paginas || '—'}</dd><dt>Encuadernación</dt><dd>${esc(l.encuadernacion || '—')}</dd></dl></aside>
  <section><h1>${esc(l.titulo)}</h1><div class="panel" style="margin:12px 0"><b>${l.es_nuevo ? 'Libro nuevo' : 'Libro usado'}</b><div class="pr"><span>Origen: ${esc(l.origen)}</span><span>${precioVisible(l)}</span></div><b>🚚 Envío rápido</b></div>
  ${ESTS.map(([k, t]) => `<button class="lb" data-est="${k}">${mios.includes(k) ? '♥' : '♡'} ${t}${mios.includes(k) ? ' ✓' : ''}</button><br>`).join('')}
  ${l.resena ? `<div class="res" style="margin-top:40px"><h2>Reseña del libro “${esc(l.titulo)}”</h2><input type="checkbox" id="r"><p>${esc(l.resena)}</p><label for="r"></label></div>` : ''}</section>
  <aside class="panel buy"><h2 style="text-align:center">${l.es_nuevo ? 'Libro nuevo' : 'Libro usado'}</h2><p style="text-align:center">${l.stock > 100 ? 'Quedan más de 100 unidades' : l.stock ? `Quedan ${l.stock} unidades` : 'Agotado'}</p>
  <dl><dt>Precio:</dt><dd>${precioVisible(l)}</dd><dt>Impuestos:</dt><dd>${cop(l.impuestos)}</dd><dt>Total (1 artículo):</dt><dd>${cop(l.precio_final + l.impuestos)}</dd></dl>
  <button class="btn p" id="add" style="width:100%;border:0;padding:18px;cursor:pointer" ${l.stock ? '' : 'disabled'}>Encargar y pagar</button><p style="margin-top:12px">Se enviará desde nuestra bodega en 2 a 5 días hábiles.</p></aside></div>
  <section class="sec"><h2>${esc(l.titulo)}</h2><div class="panel ops" style="margin-top:0"><div>
  ${rs.map(r => `<p><b style="font-size:20px">${esc(r.nombre)}</b> <span class="s">${'★'.repeat(r.calificacion)}</span> · ${esc(r.fecha)}${r.compra_verificada ? '<br><span class="link">Compra verificada</span>' : ''}<br>${esc(r.comentario)}</p>
  <button class="btn" data-voto="${r.id_resena}:1">👍 ${r.utiles} Esta opinión es útil</button> <button class="btn" data-voto="${r.id_resena}:0">👎 ${r.no_utiles} No es útil</button>`).join('') || '<p>Aún no hay reseñas.</p>'}
  ${u ? `<form id="fr" class="f2" style="margin-top:16px"><b>Agrega tu evaluación</b><select name="calificacion">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${'★'.repeat(n)}</option>`).join('')}</select><input name="comentario" placeholder="Tu opinión" maxlength="1000"><button class="btn p">Publicar</button></form>`
    : '<p><b>¿Leíste este libro? <a class="link" href="acceso.html?modo=login">Inicia sesión</a> para agregar tu propia evaluación</b></p>'}</div>
  <div>${dist.map(([n, c, pc]) => `<p>${n}★ <progress value="${pc}" max="100"></progress> ${pc}% (${c})</p>`).join('')}</div></div></section>
  <section class="sec"><h2>Preguntas y respuestas sobre el libro</h2><div class="panel" style="margin-top:0">${preguntas.map((q, i) => `<details ${i ? '' : 'open'}><summary>${esc(q.pregunta)}</summary>${esc(q.respuesta)}</details>`).join('') || 'Aún no hay preguntas.'}</div></section>`;
  const m = $('#main');
  m.onclick = e => {
    const t = e.target.closest('[data-est],[data-voto],#add'); if (!t) return;
    if (t.id === 'add') return run(async () => { await api('/carrito/' + id, { method: 'POST', body: { cantidad: 1 } }); location = 'carrito.html'; });
    if (t.dataset.est) return run(async () => { await api(`/biblioteca/${id}/${t.dataset.est}`, { method: 'POST' }); pages.producto(u); });
    const [rid, v] = t.dataset.voto.split(':'); run(async () => { await api(`/resenas/${rid}/voto`, { method: 'POST', body: { es_util: v === '1' } }); pages.producto(u); });
  };
  const fr = $('#fr');
  if (fr) fr.onsubmit = e => { e.preventDefault(); run(async () => { await api(`/libros/${id}/resenas`, { method: 'POST', body: Object.fromEntries(new FormData(fr)) }); pages.producto(u); }); };
};

pages.carrito = async u => {
  if (!u) return location = 'acceso.html?modo=login';
  const cod = sessionStorage.getItem('codigo') || '';
  const [c, metodos] = await Promise.all([api('/carrito?codigo=' + encodeURIComponent(cod)), api('/metodos-pago')]);
  if (!c.codigo_valido) { sessionStorage.removeItem('codigo'); alert('Código de descuento no válido.'); }
  const steps = `<div class="steps"><div><span>🧺</span>Carro de compras</div><div><span>ℹ️</span>Información de envío</div><div><span>💳</span>Pago</div></div>`;
  const pago = `<section class="pay"><b>Nuestras formas de pago</b><p>${metodos.map(m => `<span>${esc(m.nombre)}</span>`).join('')}</p></section>`;
  if (!c.items.length) { $('#main').innerHTML = steps + `<section class="panel" style="max-width:560px;margin:auto"><b>No tienes productos en tu carro de compras. ¿Todavía no encuentras lo que buscas?</b><p class="link">Búscalo aquí:</p><a class="link" href="index.html">• Ir a la página de inicio</a></section>` + pago; return; }
  $('#main').innerHTML = steps + `<section class="panel"><table class="tbl">${c.items.map(i => `<tr><td><a href="producto.html?id=${i.id_libro}"><b>${esc(i.titulo)}</b></a></td><td>x${i.cantidad}</td><td>${i.descuento_pct ? `<del>${cop(i.precio * i.cantidad)}</del> ` : ''}<b>${cop(i.precio_final * i.cantidad)}</b></td><td><button class="lb" data-q="${i.id_libro}">Quitar</button></td></tr>`).join('')}</table>
  <div class="f2"><label>Canjear código:<input id="cod" placeholder="Introducir código de descuento" value="${esc(c.codigo || '')}"></label><button class="btn" id="aplicar">Aplicar código</button></div>
  <p>Subtotal: ${cop(c.subtotal)}<br>Descuento: ${cop(c.descuento)}<br>Impuestos: ${cop(c.impuestos)}<br><b>Total: ${cop(c.total)}</b></p>
  <form id="fp" class="f2"><b>Información de envío y pago</b><input name="destinatario" placeholder="Nombre de quien recibe" required><input name="telefono" placeholder="Teléfono" required><input name="departamento" placeholder="Departamento" required><input name="ciudad" placeholder="Ciudad" required><input name="direccion" placeholder="Dirección" required>
  <select name="id_metodo" aria-label="Método de pago">${metodos.map(m => `<option value="${m.id_metodo}">${esc(m.nombre)}</option>`).join('')}</select><button class="btn p" style="border:0;padding:16px;cursor:pointer">Encargar y pagar</button></form></section>` + pago;
  $('#main').onclick = e => { const q = e.target.dataset.q; if (q) run(async () => { await api('/carrito/' + q, { method: 'DELETE' }); pages.carrito(u); }); };
  $('#aplicar').onclick = () => { sessionStorage.setItem('codigo', $('#cod').value.trim()); pages.carrito(u); };
  $('#fp').onsubmit = e => { e.preventDefault(); run(async () => {
    const r = await api('/pedidos', { method: 'POST', body: { ...Object.fromEntries(new FormData(e.target)), codigo: c.codigo } });
    sessionStorage.removeItem('codigo'); sessionStorage.setItem('aviso', `Pedido #${r.id_pedido} confirmado. Total ${cop(r.total)}.`); location = 'index.html'; }); };
};

pages.acceso = async () => {
  const login = qs().get('modo') === 'login';
  $('#main').innerHTML = `<div class="reg"><form class="panel" id="fa"><h2>${login ? 'Inicia sesión' : 'Crea una cuenta'}</h2><br>
  <label>Email<input type="email" name="email" required></label>${login ? '' : '<label>Nombre<input type="text" name="nombre" required></label>'}
  <label>Contraseña<input type="password" name="contrasena" required>${login ? '' : '<small>Mínimo 6 caracteres y una mayúscula</small>'}</label>
  ${login ? '' : '<label><input type="checkbox" name="terminos" required> Acepto <a href="#" style="text-decoration:underline">Términos y condiciones</a> y las <a href="#" style="text-decoration:underline">Políticas de Privacidad y Tratamiento de Datos</a></label>'}
  <p id="err" style="color:#b00020"></p><button class="btn p" style="width:100%;border:0">${login ? 'Entrar' : 'Crear cuenta'}</button>
  <p>${login ? '¿No tienes cuenta? <a class="link" href="acceso.html">Crea una</a>' : '¿Ya tienes cuenta? <a class="link" href="acceso.html?modo=login">Inicia sesión</a>'}</p></form>
  <aside class="panel"><h2>Beneficios de comprar en Entre-Lineas.com</h2><p><b>Múltiples métodos de pago</b><br>Paga con tarjeta de crédito o débito</p><p><b>Garantía de devolución</b><br>Si tu producto falla, puedes devolverlo y te devolveremos el dinero o reemplazaremos tu producto</p><p><b>Envíos seguros y rápidos</b><br>Entre-Líneas llega a la puerta de tu casa rápido y seguro</p></aside></div>`;
  $('#fa').onsubmit = async e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); d.terminos = !!d.terminos;
    try { await api(login ? '/auth/login' : '/auth/registro', { method: 'POST', body: d }); location = 'index.html'; } catch (x) { $('#err').textContent = x.message; } };
};

pages.biblioteca = async () => {
  const est = qs().get('estado') || '', N = { favorito: 'Favoritos', leyendo: 'Leyendo', lista_deseos: 'Lista de deseos', completado: 'Completados' };
  const libros = await api('/biblioteca' + (est ? '?estado=' + est : ''));
  $('#main').innerHTML = `<div class="bar">Ver: <a href="biblioteca.html">Todos los libros</a>${Object.entries(N).map(([k, v]) => `<a href="biblioteca.html?estado=${k}">${v}</a>`).join('')}</div>`
    + (libros.length ? `<div class="band row">${libros.map(card).join('')}</div>` : '<p class="panel">Aún no tienes libros aquí. Guarda alguno desde su ficha.</p>');
};

(async () => {
  const pg = document.body.dataset.page; let u = null;
  try { u = (await api('/auth/yo')).usuario; } catch {}
  chrome(u, pg);
  try { await pages[pg](u); } catch (e) { e.status === 401 ? location = 'acceso.html?modo=login' : $('#main').innerHTML = `<p class="flash">${esc(e.message)}</p>`; }
})();

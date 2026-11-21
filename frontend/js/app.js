// Helpers compartidos
const $ = (selector, root = document) => root.querySelector(selector);

const esc = value =>
  String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));

const cop = value =>
  '$ ' + String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const stars = value => {
  const rating = Math.round(value || 0);
  return '★'.repeat(rating) + '<i>' + '★'.repeat(5 - rating) + '</i>';
};

const qs = () => new URLSearchParams(location.search);

const precioVisible = libro => libro.descuento_pct
  ? `<span class="precio-rebajado"><del>${cop(libro.precio)}</del><b>${cop(libro.precio_final)}</b></span>`
  : cop(libro.precio_final ?? libro.precio);

async function api(url, options = {}) {
  const response = await fetch('/api' + url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw Object.assign(new Error(data.error || 'Error inesperado'), {
      status: response.status,
    });
  }

  return data;
}

const run = async action => {
  try {
    await action();
  } catch (error) {
    if (error.status === 401) {
      location = 'acceso.html?modo=login';
    } else {
      alert(error.message);
    }
  }
};

// Componentes compartidos
const card = book => `
  <a class="card" href="producto.html?id=${book.id_libro}">
    <div class="cover" style="--h:${book.id_libro * 47 % 360}">
      ${book.portada_url
        ? `<img src="${esc(book.portada_url)}" alt="${esc(book.titulo)}" loading="lazy" onerror="this.replaceWith(this.alt)">`
        : esc(book.titulo)}
      ${book.descuento_pct
        ? `<span class="discount-badge">-${book.descuento_pct}%</span>`
        : ''}
    </div>
    <div class="i">
      ${esc(book.titulo)}<br>
      Por: ${esc(book.autor)}<br>
      <span class="s">${stars(book.calificacion)}</span>
      <small>
        <span>${book.stock} unidades</span>
        <span class="card-price">${precioVisible(book)}</span>
      </small>
    </div>
  </a>`;

const WHY = `
  <section class="why">
    <h2>¿Por qué Entre Líneas?</h2>
    <div>
      <p><b>Soporte 24/7</b>Estamos aquí para ayudarte siempre</p>
      <p><b>Calidad garantizada</b>Solo los mejores títulos seleccionados</p>
      <p><b>Envío rápido</b>Entregas en 24-48 horas a todo el país</p>
      <p><b>Pago seguro</b>Múltiples métodos de pago confiables</p>
    </div>
  </section>`;

const FOOT = `
  <footer>
    <div>
      <h3>Conócenos</h3>
      <a href="#">Blog</a>
      <a href="#">Acerca de nosotros</a>
    </div>
    <div>
      <h3>Contáctanos</h3>
      <p>3211234567</p>
      <a href="mailto:EntreLineas@book.com">EntreLineas@book.com</a>
    </div>
    <div class="social">
      <h3>Redes sociales</h3>
      <div class="social-links">
        <a href="https://www.instagram.com/" aria-label="Instagram: Entre Lineas">
          <span>IG</span>
          <b>@Entre_Lineas</b>
        </a>
        <a href="https://www.facebook.com/" aria-label="Facebook: Entre Lineas">
          <span>FB</span>
          <b>Entre Lineas</b>
        </a>
      </div>
    </div>
  </footer>`;

const CATS = `
  <div class="cats">
    <a href="catalogo.html?categoria=1">
      <span></span>
      Cada historia cuenta
      <b>Ver libros</b>
    </a>
    <a href="catalogo.html?categoria=2">
      <span style="background:linear-gradient(#f6a38a,#6b8fb3)"></span>
      Nos conocimos en el mar
      <b>Ver más</b>
    </a>
    <a href="catalogo.html?categoria=6">
      <span style="background:#400"></span>
      Historias de terror
      <b>Ver más</b>
    </a>
  </div>`;

// Estructura común de navegación y pie de página
function chrome(user, page) {
  $('#hdr').innerHTML = `
    <input type="checkbox" id="m">
    <label for="m" class="ico" aria-label="Abrir menú">☰</label>
    <label for="m" class="ov"></label>
    <nav class="side" aria-label="Menú">
      <label for="m" class="x">✕</label>
      <strong>${user ? esc(user.nombre) : 'Invitado'}</strong>
      ${user
        ? `<a href="biblioteca.html?estado=favorito">Favoritos</a>
           <a href="biblioteca.html">Biblioteca</a>
           <a href="#" id="salir">Cerrar sesión</a>`
        : `<a href="acceso.html?modo=login">Iniciar sesión</a>
           <a href="acceso.html">Crear cuenta</a>`}
      <a href="index.html">Inicio</a>
      <a href="carrito.html">Cesta</a>
    </nav>
    <form action="catalogo.html" role="search">
      <input
        type="search"
        name="q"
        value="${esc(qs().get('q') || '')}"
        placeholder="Título, autor o ISBN"
        aria-label="Buscar"
      >
      <button aria-label="Buscar">🔍</button>
    </form>
    <a href="index.html" class="logo">Entre<b>Líneas</b></a>`;

  $('#pie').innerHTML = (['carrito', 'acceso'].includes(page) ? '' : WHY) + FOOT;

  const logoutButton = $('#salir');
  if (logoutButton) {
    logoutButton.onclick = event => {
      event.preventDefault();
      api('/auth/salir', { method: 'POST' })
        .then(() => location = 'index.html');
    };
  }

  const notice = sessionStorage.getItem('aviso');
  if (notice) {
    $('#av').innerHTML = `
      <p class="flash" style="max-width:1200px;margin:12px auto">
        ${esc(notice)}
      </p>`;
    sessionStorage.removeItem('aviso');
  }
}

// Renderizadores de páginas
const pages = {};

pages.index = async () => {
  const data = await api('/home');

  $('#main').innerHTML = `
    <div class="promo">
      <div>
        <small>OFERTAS EN LIBROS SELECCIONADOS</small>
        <p>Hasta <strong>80%</strong> de descuento</p>
        <a class="btn" href="catalogo.html?ofertas=1">Ver ofertas</a>
      </div>
    </div>
    ${data.secciones.map((section, index) => `
      <section class="band">
        <span class="tag">${esc(section.nombre)}</span>
        <div class="row">${section.libros.map(card).join('')}</div>
      </section>
      ${index === 1 ? CATS : ''}`).join('')}
    <div class="cats">
      ${data.autores.map(author => `
        <div class="autor">
          <i></i>
          <div>
            <h3>
              ${esc(author.nombre)}, nuestro autor del mes
              ${author.ambito === 'colombia' ? 'Colombia' : 'internacional'}
            </h3>
            <p>
              <a class="btn p" href="catalogo.html?q=${encodeURIComponent(author.nombre)}">
                Saber más
              </a>
            </p>
          </div>
        </div>`).join('')}
    </div>`;
};

pages.catalogo = async () => {
  const filters = await api('/filtros');
  const params = qs();
  const checked = (key, value) =>
    params.getAll(key).includes(String(value)) ? 'checked' : '';
  const group = (title, key, values) => `
    <h3>${title}</h3>
    ${values.map(value => `
      <label>
        <input type="checkbox" name="${key}" value="${esc(value)}" ${checked(key, value)}>
        ${esc(value)}
      </label>`).join('')}`;
  const order = params.get('orden') || '';
  const onlyOffers = params.get('ofertas') === '1';

  $('#main').innerHTML = `
    <form class="cat" id="ff">
      <input type="hidden" name="q" value="${esc(params.get('q') || '')}">
      <input type="hidden" name="ofertas" value="${onlyOffers ? '1' : ''}">
      <aside class="filtros">
        <h3>CATEGORÍA:</h3>
        <label>
          <input type="radio" name="categoria" value="" ${params.get('categoria') ? '' : 'checked'}>
          Todas
        </label>
        ${filters.categorias.map(category => `
          <label>
            <input
              type="radio"
              name="categoria"
              value="${category.id_categoria}"
              ${checked('categoria', category.id_categoria)}
            >
            ${esc(category.nombre)}
          </label>`).join('')}
        ${group('IDIOMA:', 'idioma', filters.idiomas.map(item => item.nombre))}
        ${group('EDITORIAL:', 'editorial', filters.editoriales.map(item => item.nombre))}
        ${group('AÑO:', 'anio', filters.anios)}
        <button class="btn" style="margin-top:12px;width:100%">
          Aplicar filtros
        </button>
      </aside>
      <div>
        <div class="bar">
          ${onlyOffers
            ? '<strong class="offer-label">Ofertas en libros seleccionados</strong>'
            : 'Ver:'}
          <button name="formato" value="fisico">Libros físicos</button>
          <button name="formato" value="digital">Libros digitales</button>
          <button name="formato" value="">Todos los libros</button>
          <select name="orden" aria-label="Ordenar por">
            ${[
              ['', 'Relevancia'],
              ['precio_asc', 'Menor precio'],
              ['precio_desc', 'Mayor precio'],
              ['calificacion', 'Mejor calificados'],
            ].map(([value, label]) => `
              <option value="${value}" ${order === value ? 'selected' : ''}>
                ${label}
              </option>`).join('')}
          </select>
        </div>
        <div id="res"></div>
      </div>
    </form>`;

  const form = $('#ff');
  const loadBooks = async searchParams => {
    history.replaceState(null, '', '?' + searchParams);
    const books = await api('/libros?' + searchParams);

    $('#res').innerHTML = books.length
      ? `<div class="band row">${books.map(card).join('')}</div>`
      : '<p class="panel">No encontramos libros con esos filtros.</p>';
  };
  const readForm = submitter => {
    const searchParams = new URLSearchParams();
    for (const [key, value] of new FormData(form, submitter)) {
      if (value) searchParams.append(key, value);
    }
    return searchParams;
  };

  form.onsubmit = event => {
    event.preventDefault();
    loadBooks(readForm(event.submitter));
  };
  form.orden.onchange = () => form.requestSubmit();
  await loadBooks(params);
};

pages.producto = async user => {
  const id = qs().get('id');
  const { libro, resenas, preguntas, mios } = await api('/libros/' + id);

  document.title = libro.titulo + ' | EntreLíneas';

  const distribution = [5, 4, 3, 2, 1].map(rating => {
    const count = resenas.filter(review => review.calificacion === rating).length;
    const percentage = resenas.length
      ? Math.round(100 * count / resenas.length)
      : 0;
    return [rating, count, percentage];
  });
  const states = [
    ['lista_deseos', 'Agregar a lista de deseos'],
    ['favorito', 'Marcar como favorito'],
    ['leyendo', 'Lo estoy leyendo'],
    ['completado', 'Ya lo leí'],
  ];
  const cover = `
    <div class="cover" style="--h:${libro.id_libro * 47 % 360};border-radius:10px">
      ${libro.portada_url
        ? `<img src="${esc(libro.portada_url)}" alt="${esc(libro.titulo)}" onerror="this.replaceWith(this.alt)">`
        : esc(libro.titulo)}
      ${libro.descuento_pct
        ? `<span class="discount-badge">-${libro.descuento_pct}%</span>`
        : ''}
    </div>`;

  $('#main').innerHTML = `
    <div class="prod">
      <aside class="panel ficha">
        ${cover}
        <dl>
          <dt>Formato</dt>
          <dd>${libro.formato === 'fisico' ? 'Libro físico' : 'Libro digital'}</dd>
          <dt>Editorial</dt>
          <dd class="a">${esc(libro.editorial || '—')}</dd>
          <dt>Autor</dt>
          <dd class="a">${esc(libro.autor)}</dd>
          <dt>Categoría</dt>
          <dd>${esc(libro.categorias || '—')}</dd>
          <dt>Año</dt>
          <dd>${libro.anio || '—'}</dd>
          <dt>Idioma</dt>
          <dd>${esc(libro.idioma)}</dd>
          <dt>N.° páginas</dt>
          <dd>${libro.num_paginas || '—'}</dd>
          <dt>Encuadernación</dt>
          <dd>${esc(libro.encuadernacion || '—')}</dd>
        </dl>
      </aside>
      <section>
        <h1>${esc(libro.titulo)}</h1>
        <div class="panel" style="margin:12px 0">
          <b>${libro.es_nuevo ? 'Libro nuevo' : 'Libro usado'}</b>
          <div class="pr">
            <span>Origen: ${esc(libro.origen)}</span>
            <span>${precioVisible(libro)}</span>
          </div>
          <b>🚚 Envío rápido</b>
        </div>
        ${states.map(([key, label]) => `
          <button class="lb" data-est="${key}">
            ${mios.includes(key) ? '♥' : '♡'} ${label}${mios.includes(key) ? ' ✓' : ''}
          </button>
          <br>`).join('')}
        ${libro.resena ? `
          <div class="res" style="margin-top:40px">
            <h2>Reseña del libro “${esc(libro.titulo)}”</h2>
            <input type="checkbox" id="r">
            <p>${esc(libro.resena)}</p>
            <label for="r"></label>
          </div>` : ''}
      </section>
      <aside class="panel buy">
        <h2 style="text-align:center">${libro.es_nuevo ? 'Libro nuevo' : 'Libro usado'}</h2>
        <p style="text-align:center">
          ${libro.stock > 100
            ? 'Quedan más de 100 unidades'
            : libro.stock
              ? `Quedan ${libro.stock} unidades`
              : 'Agotado'}
        </p>
        <dl>
          <dt>Precio:</dt>
          <dd>${precioVisible(libro)}</dd>
          <dt>Impuestos:</dt>
          <dd>${cop(libro.impuestos)}</dd>
          <dt>Total (1 artículo):</dt>
          <dd>${cop(libro.precio_final + libro.impuestos)}</dd>
        </dl>
        <button
          class="btn p"
          id="add"
          style="width:100%;border:0;padding:18px;cursor:pointer"
          ${libro.stock ? '' : 'disabled'}
        >
          Encargar y pagar
        </button>
        <p style="margin-top:12px">Se enviará desde nuestra bodega en 2 a 5 días hábiles.</p>
      </aside>
    </div>
    <section class="sec">
      <h2>${esc(libro.titulo)}</h2>
      <div class="panel ops" style="margin-top:0">
        <div>
          ${resenas.map(review => `
            <p>
              <b style="font-size:20px">${esc(review.nombre)}</b>
              <span class="s">${'★'.repeat(review.calificacion)}</span>
              · ${esc(review.fecha)}
              ${review.compra_verificada
                ? '<br><span class="link">Compra verificada</span>'
                : ''}
              <br>${esc(review.comentario)}
            </p>
            <button class="btn" data-voto="${review.id_resena}:1">
              👍 ${review.utiles} Esta opinión es útil
            </button>
            <button class="btn" data-voto="${review.id_resena}:0">
              👎 ${review.no_utiles} No es útil
            </button>`).join('') || '<p>Aún no hay reseñas.</p>'}
          ${user ? `
            <form id="fr" class="f2" style="margin-top:16px">
              <b>Agrega tu evaluación</b>
              <select name="calificacion">
                ${[5, 4, 3, 2, 1].map(rating => `
                  <option value="${rating}">${'★'.repeat(rating)}</option>`).join('')}
              </select>
              <input name="comentario" placeholder="Tu opinión" maxlength="1000">
              <button class="btn p">Publicar</button>
            </form>`
            : `<p>
                <b>
                  ¿Leíste este libro?
                  <a class="link" href="acceso.html?modo=login">Inicia sesión</a>
                  para agregar tu propia evaluación
                </b>
              </p>`}
        </div>
        <div>
          ${distribution.map(([rating, count, percentage]) => `
            <p>
              ${rating}★
              <progress value="${percentage}" max="100"></progress>
              ${percentage}% (${count})
            </p>`).join('')}
        </div>
      </div>
    </section>
    <section class="sec">
      <h2>Preguntas y respuestas sobre el libro</h2>
      <div class="panel" style="margin-top:0">
        ${preguntas.map((question, index) => `
          <details ${index ? '' : 'open'}>
            <summary>${esc(question.pregunta)}</summary>
            ${esc(question.respuesta)}
          </details>`).join('') || 'Aún no hay preguntas.'}
      </div>
    </section>`;

  const main = $('#main');
  main.onclick = event => {
    const target = event.target.closest('[data-est],[data-voto],#add');
    if (!target) return;

    if (target.id === 'add') {
      return run(async () => {
        await api('/carrito/' + id, {
          method: 'POST',
          body: { cantidad: 1 },
        });
        location = 'carrito.html';
      });
    }

    if (target.dataset.est) {
      return run(async () => {
        await api(`/biblioteca/${id}/${target.dataset.est}`, { method: 'POST' });
        pages.producto(user);
      });
    }

    const [reviewId, vote] = target.dataset.voto.split(':');
    run(async () => {
      await api(`/resenas/${reviewId}/voto`, {
        method: 'POST',
        body: { es_util: vote === '1' },
      });
      pages.producto(user);
    });
  };

  const reviewForm = $('#fr');
  if (reviewForm) {
    reviewForm.onsubmit = event => {
      event.preventDefault();
      run(async () => {
        await api(`/libros/${id}/resenas`, {
          method: 'POST',
          body: Object.fromEntries(new FormData(reviewForm)),
        });
        pages.producto(user);
      });
    };
  }
};

pages.carrito = async user => {
  if (!user) return location = 'acceso.html?modo=login';

  const code = sessionStorage.getItem('codigo') || '';
  const [cart, paymentMethods] = await Promise.all([
    api('/carrito?codigo=' + encodeURIComponent(code)),
    api('/metodos-pago'),
  ]);

  if (!cart.codigo_valido) {
    sessionStorage.removeItem('codigo');
    alert('Código de descuento no válido.');
  }

  const steps = `
    <div class="steps">
      <div><span>🧺</span>Carro de compras</div>
      <div><span>ℹ️</span>Información de envío</div>
      <div><span>💳</span>Pago</div>
    </div>`;
  const paymentSection = `
    <section class="pay">
      <b>Nuestras formas de pago</b>
      <p>${paymentMethods.map(method => `<span>${esc(method.nombre)}</span>`).join('')}</p>
    </section>`;

  if (!cart.items.length) {
    $('#main').innerHTML = steps + `
      <section class="panel" style="max-width:560px;margin:auto">
        <b>No tienes productos en tu carro de compras. ¿Todavía no encuentras lo que buscas?</b>
        <p class="link">Búscalo aquí:</p>
        <a class="link" href="index.html">• Ir a la página de inicio</a>
      </section>` + paymentSection;
    return;
  }

  $('#main').innerHTML = steps + `
    <section class="panel">
      <table class="tbl">
        ${cart.items.map(item => `
          <tr>
            <td>
              <a href="producto.html?id=${item.id_libro}">
                <b>${esc(item.titulo)}</b>
              </a>
            </td>
            <td>x${item.cantidad}</td>
            <td>
              ${item.descuento_pct
                ? `<del>${cop(item.precio * item.cantidad)}</del> `
                : ''}
              <b>${cop(item.precio_final * item.cantidad)}</b>
            </td>
            <td><button class="lb" data-q="${item.id_libro}">Quitar</button></td>
          </tr>`).join('')}
      </table>
      <div class="f2">
        <label>
          Canjear código:
          <input
            id="cod"
            placeholder="Introducir código de descuento"
            value="${esc(cart.codigo || '')}"
          >
        </label>
        <button class="btn" id="aplicar">Aplicar código</button>
      </div>
      <p>
        Subtotal: ${cop(cart.subtotal)}<br>
        Descuento: ${cop(cart.descuento)}<br>
        Impuestos: ${cop(cart.impuestos)}<br>
        <b>Total: ${cop(cart.total)}</b>
      </p>
      <form id="fp" class="f2">
        <b>Información de envío y pago</b>
        <input name="destinatario" placeholder="Nombre de quien recibe" required>
        <input name="telefono" placeholder="Teléfono" required>
        <input name="departamento" placeholder="Departamento" required>
        <input name="ciudad" placeholder="Ciudad" required>
        <input name="direccion" placeholder="Dirección" required>
        <select name="id_metodo" aria-label="Método de pago">
          ${paymentMethods.map(method => `
            <option value="${method.id_metodo}">${esc(method.nombre)}</option>`).join('')}
        </select>
        <button class="btn p" style="border:0;padding:16px;cursor:pointer">
          Encargar y pagar
        </button>
      </form>
    </section>` + paymentSection;

  $('#main').onclick = event => {
    const bookId = event.target.dataset.q;
    if (bookId) {
      run(async () => {
        await api('/carrito/' + bookId, { method: 'DELETE' });
        pages.carrito(user);
      });
    }
  };

  $('#aplicar').onclick = () => {
    sessionStorage.setItem('codigo', $('#cod').value.trim());
    pages.carrito(user);
  };

  $('#fp').onsubmit = event => {
    event.preventDefault();
    run(async () => {
      const result = await api('/pedidos', {
        method: 'POST',
        body: {
          ...Object.fromEntries(new FormData(event.target)),
          codigo: cart.codigo,
        },
      });
      sessionStorage.removeItem('codigo');
      sessionStorage.setItem(
        'aviso',
        `Pedido #${result.id_pedido} confirmado. Total ${cop(result.total)}.`,
      );
      location = 'index.html';
    });
  };
};

pages.acceso = async () => {
  const login = qs().get('modo') === 'login';

  $('#main').innerHTML = `
    <div class="reg">
      <form class="panel" id="fa">
        <h2>${login ? 'Inicia sesión' : 'Crea una cuenta'}</h2>
        <br>
        <label>
          Email
          <input type="email" name="email" required>
        </label>
        ${login ? '' : `
          <label>
            Nombre
            <input type="text" name="nombre" required>
          </label>`}
        <label>
          Contraseña
          <input type="password" name="contrasena" required>
          ${login ? '' : '<small>Mínimo 6 caracteres y una mayúscula</small>'}
        </label>
        ${login ? '' : `
          <label>
            <input type="checkbox" name="terminos" required>
            Acepto
            <a href="#" style="text-decoration:underline">Términos y condiciones</a>
            y las
            <a href="#" style="text-decoration:underline">
              Políticas de Privacidad y Tratamiento de Datos
            </a>
          </label>`}
        <p id="err" style="color:#b00020"></p>
        <button class="btn p" style="width:100%;border:0">
          ${login ? 'Entrar' : 'Crear cuenta'}
        </button>
        <p>
          ${login
            ? '¿No tienes cuenta? <a class="link" href="acceso.html">Crea una</a>'
            : '¿Ya tienes cuenta? <a class="link" href="acceso.html?modo=login">Inicia sesión</a>'}
        </p>
      </form>
      <aside class="panel">
        <h2>Beneficios de comprar en Entre-Lineas.com</h2>
        <p><b>Múltiples métodos de pago</b><br>Paga con tarjeta de crédito o débito</p>
        <p>
          <b>Garantía de devolución</b><br>
          Si tu producto falla, puedes devolverlo y te devolveremos el dinero o
          reemplazaremos tu producto
        </p>
        <p>
          <b>Envíos seguros y rápidos</b><br>
          Entre-Líneas llega a la puerta de tu casa rápido y seguro
        </p>
      </aside>
    </div>`;

  $('#fa').onsubmit = async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    data.terminos = !!data.terminos;

    try {
      await api(login ? '/auth/login' : '/auth/registro', {
        method: 'POST',
        body: data,
      });
      location = 'index.html';
    } catch (error) {
      $('#err').textContent = error.message;
    }
  };
};

pages.biblioteca = async () => {
  const state = qs().get('estado') || '';
  const states = {
    favorito: 'Favoritos',
    leyendo: 'Leyendo',
    lista_deseos: 'Lista de deseos',
    completado: 'Completados',
  };
  const books = await api('/biblioteca' + (state ? '?estado=' + state : ''));

  $('#main').innerHTML = `
    <div class="bar">
      Ver:
      <a href="biblioteca.html">Todos los libros</a>
      ${Object.entries(states).map(([key, label]) => `
        <a href="biblioteca.html?estado=${key}">${label}</a>`).join('')}
    </div>
    ${books.length
      ? `<div class="band row">${books.map(card).join('')}</div>`
      : '<p class="panel">Aún no tienes libros aquí. Guarda alguno desde su ficha.</p>'}`;
};

// Inicialización de la página actual
(async () => {
  const page = document.body.dataset.page;
  let user = null;

  try {
    user = (await api('/auth/yo')).usuario;
  } catch {}

  chrome(user, page);

  try {
    await pages[page](user);
  } catch (error) {
    if (error.status === 401) {
      location = 'acceso.html?modo=login';
    } else {
      $('#main').innerHTML = `<p class="flash">${esc(error.message)}</p>`;
    }
  }
})();

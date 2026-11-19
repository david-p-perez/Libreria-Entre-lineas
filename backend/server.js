const express = require('express');
const session = require('express-session');
const path = require('path');

require('./src/db');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) {
  throw new Error('Define SESSION_SECRET antes de iniciar el servidor en producción.');
}

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

if (isProduction) app.set('trust proxy', 1);

app.use(
  session({
    secret: sessionSecret || 'solo-desarrollo-cambia-este-secreto',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(
  '/api',
  require('./src/routes/catalogo'),
  require('./src/routes/usuario'),
  require('./src/routes/compra'),
);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error del servidor' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`EntreLíneas disponible en http://localhost:${PORT}`);
});

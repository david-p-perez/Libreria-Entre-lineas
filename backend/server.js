const express = require('express'), session = require('express-session'), path = require('path');
require('./src/db');
const app = express();
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || 'dev-cambia-esto', resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 } }));
app.use('/api', require('./src/routes/catalogo'), require('./src/routes/usuario'), require('./src/routes/compra'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Error del servidor' }); });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`EntreLíneas en http://localhost:${PORT}`));

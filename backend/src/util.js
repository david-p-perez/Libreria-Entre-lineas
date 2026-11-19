const IVA = 0.19;
const ESTADOS_BIBLIOTECA = ['favorito', 'leyendo', 'lista_deseos', 'completado'];

function login(req, res, next) {
  if (!req.session.uid) {
    return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  }

  next();
}

function lista(value) {
  return [].concat(value || []).filter(Boolean);
}

module.exports = { IVA, ESTADOS_BIBLIOTECA, login, lista };

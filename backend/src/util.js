module.exports = {
  IVA: 0.19,
  login: (req, res, next) => req.session.uid ? next() : res.status(401).json({ error: 'Inicia sesión para continuar.' }),
  lista: v => [].concat(v || []).filter(Boolean),
};

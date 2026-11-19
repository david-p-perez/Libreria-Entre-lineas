const Database = require('better-sqlite3'), fs = require('fs'), path = require('path'), bcrypt = require('bcryptjs');
const dir = path.join(__dirname, '../../database'), file = path.join(dir, 'entrelineas.db');
const nueva = !fs.existsSync(file);
const db = new Database(file);
db.pragma('foreign_keys = ON');
if (nueva) {  // primera ejecución: crea tablas y carga los datos de ejemplo
  db.exec(fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8'));
  db.exec(fs.readFileSync(path.join(dir, 'datos.sql'), 'utf8'));
  db.prepare('update usuario set contrasena_hash=? where id_usuario=1').run(bcrypt.hashSync('Clave123', 10));
}
module.exports = db;

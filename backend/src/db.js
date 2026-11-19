const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const databaseDirectory = path.join(__dirname, '../../database');
const databaseFile = path.join(databaseDirectory, 'entrelineas.db');
const isNewDatabase = !fs.existsSync(databaseFile);

const db = new Database(databaseFile);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

if (isNewDatabase) {
  const initializeDatabase = db.transaction(() => {
    const schema = fs.readFileSync(path.join(databaseDirectory, 'schema.sql'), 'utf8');
    const seedData = fs.readFileSync(path.join(databaseDirectory, 'datos.sql'), 'utf8');

    db.exec(schema);
    db.exec(seedData);
    db.prepare('UPDATE usuario SET contrasena_hash = ? WHERE id_usuario = 1').run(
      bcrypt.hashSync('Clave123', 10),
    );
  });

  initializeDatabase();
}

module.exports = db;

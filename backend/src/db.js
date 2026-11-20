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

const libroColumns = db.pragma('table_info(libro)');
if (libroColumns.length && !libroColumns.some(({ name }) => name === 'descuento_pct')) {
  db.transaction(() => {
    db.exec(`
      ALTER TABLE libro
      ADD COLUMN descuento_pct INTEGER NOT NULL DEFAULT 0
      CHECK (descuento_pct BETWEEN 0 AND 80)
    `);
    db.exec(`
      UPDATE libro
      SET descuento_pct = CASE id_libro
        WHEN 2 THEN 50
        WHEN 17 THEN 30
        WHEN 20 THEN 20
        WHEN 21 THEN 80
      END
      WHERE id_libro IN (2,17,20,21)
    `);
  })();
}

const catalogoColumns = db.pragma('table_info(vista_catalogo)');
if (libroColumns.length && !catalogoColumns.some(({ name }) => name === 'descuento_pct')) {
  db.transaction(() => {
    db.exec('DROP VIEW IF EXISTS vista_catalogo');
    db.exec(`
      CREATE VIEW vista_catalogo AS
      SELECT
        l.id_libro, l.titulo, a.nombre AS autor, e.nombre AS editorial,
        i.nombre AS idioma, l.formato, l.anio, l.stock, l.precio,
        l.descuento_pct,
        ROUND(l.precio * (100 - l.descuento_pct) / 100.0) AS precio_final,
        l.portada_url,
        ROUND(AVG(r.calificacion), 1) AS calificacion,
        COUNT(r.id_resena) AS num_resenas
      FROM libro l
      JOIN autor a USING (id_autor)
      JOIN idioma i USING (id_idioma)
      LEFT JOIN editorial e USING (id_editorial)
      LEFT JOIN resena r USING (id_libro)
      GROUP BY l.id_libro
    `);
  })();
}

module.exports = db;

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db_test.db');

db.serialize(() => {
  // Création de la table "produits"
  db.run(`CREATE TABLE produits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    description TEXT,
    prix REAL
  )`);

  // Création de la table "medias"
  db.run(`CREATE TABLE medias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER,
    type TEXT,
    url TEXT,
    FOREIGN KEY (produit_id) REFERENCES produits(id)
  )`);

  // Création de la table "utilisateurs"
  db.run(`CREATE TABLE utilisateurs (
    email TEXT PRIMARY KEY,
    mot_de_passe TEXT,
    token TEXT
  )`);

  // Création de la table "stock"
  db.run(`CREATE TABLE stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER,
    quantite INTEGER,
    FOREIGN KEY (produit_id) REFERENCES produits(id)
  )`);
});

module.exports = db;

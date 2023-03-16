const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const qr = require('qrcode');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const app = express();
app.use(bodyParser.json());
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'API de produits',
      version: '1.0.0',
      description: 'Une API pour gérer les produits',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur local',
      },
    ],
  };
const options = {
    swaggerDefinition,
    apis: ['app.js'],
  };
  
  const swaggerSpec = swaggerJSDoc(options);
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Connexion à la base de données SQLite
const db = process.env.NODE_ENV === 'test' ? new sqlite3.Database(':memory:') : new sqlite3.Database('payetonkawaDB.db');
// Remplacez ":memory:" par le nom de votre fichier de base de données s'il existe déjà
/*db.serialize(() => {
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
*/

/**
 * @swagger
 * /produits:
 *   get:
 *     summary: Récupérer la liste des produits
 *     description: Récupère la liste de tous les produits de la base de données.
 *     responses:
 *       200:
 *         description: La liste des produits
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: L'identifiant unique du produit
 *                   nom:
 *                     type: string
 *                     description: Le nom du produit
 *                   description:
 *                     type: string
 *                     description: La description du produit
 *                   prix:
 *                     type: number
 *                     format: float
 *                     description: Le prix du produit
 *       500:
 *         description: Une erreur est survenue.
 */
// Route pour obtenir la liste de produits
app.get('/produits', (req, res) => {
    db.all('SELECT p.*, s.quantite FROM produits p LEFT JOIN stock s ON p.id = s.produit_id', (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).send('Une erreur est survenue.');
      } else {
        res.json(rows);
      }
    });
  });
  

/**
 * @swagger
 * /produits:
 *   post:
 *     summary: Ajouter un produit
 *     description: Ajoute un nouveau produit avec sa description, son prix, les médias associés et les informations de stock.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Le nom du produit
 *               description:
 *                 type: string
 *                 description: La description du produit
 *               prix:
 *                 type: number
 *                 description: Le prix du produit
 *               medias:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Le type de média
 *                     url:
 *                       type: string
 *                       description: L'URL du média
 *                   required:
 *                     - type
 *                     - url
 *               stock:
 *                 type: array
 *                 description: Les informations de stock du produit
 *                 items:
 *                   type: object
 *                   properties:
 *                     quantite:
 *                       type: integer
 *                       description: La quantité de produits en stock
 *     responses:
 *       200:
 *         description: Le produit a été ajouté avec succès
 *       500:
 *         description: Une erreur est survenue lors de l'ajout du produit
 */

// Exemple de body:
// {
//   "nom": "T-shirt rouge",
//   "description": "Un t-shirt rouge en coton",
//   "prix": 19.99,
//   "stock": [
//     {
//       "quantite": 10
//     },
//     {
//       "quantite": 5
//     }
//   ],
//   "medias": [
//     {
//       "type": "image",
//       "url": "https://example.com/images/tshirt-rouge.jpg"
//     },
//     {
//       "type": "video",
//       "url": "https://example.com/videos/tshirt-rouge.mp4"
//     }
//   ]
// }


app.post('/produits', (req, res) => {
    const { nom, description, prix, medias, stock } = req.body;
  
    db.run(`INSERT INTO produits (nom, description, prix) VALUES (?, ?, ?)`, [nom, description, prix], function(err) {
      if (err) {
        console.error(err);
        res.status(500).send('Une erreur est survenue.');
      } else {
        const produit_id = this.lastID;
  
        if (stock && stock.length > 0) {
          const values = stock.map(stock => `(${produit_id}, ${stock.quantite})`).join(',');
          db.run(`INSERT INTO stock (produit_id, quantite) VALUES ${values}`, err => {
            if (err) {
              console.error(err);
              res.status(500).send('Une erreur est survenue.');
            } else {
              if (medias && medias.length > 0) {
                const values = medias.map(media => `('${media.type}', '${media.url}', ${produit_id})`).join(',');
                db.run(`INSERT INTO medias (type, url, produit_id) VALUES ${values}`, err => {
                  if (err) {
                    console.error(err);
                    res.status(500).send('Une erreur est survenue.');
                  } else {
                    res.send('Produit ajouté!');
                  }
                });
              } else {
                res.send('Produit ajouté!');
              }
            }
          });
        } else {
          if (medias && medias.length > 0) {
            const values = medias.map(media => `('${media.type}', '${media.url}', ${produit_id})`).join(',');
            db.run(`INSERT INTO medias (type, url, produit_id) VALUES ${values}`, err => {
              if (err) {
                console.error(err);
                res.status(500).send('Une erreur est survenue.');
              } else {
                res.send('Produit ajouté!');
              }
            });
          } else {
            res.send('Produit ajouté!');
          }
        }
      }
    });
  });
     
// Route pour l'inscription d'un utilisateur
/**
 * @swagger
 * /inscription:
 *   post:
 *     summary: Inscription d'un utilisateur
 *     description: Permet l'inscription d'un utilisateur en envoyant un email contenant un QR code pour se connecter à l'API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: L'e-mail de l'utilisateur
 *               mot_de_passe:
 *                 type: string
 *                 description: Le mot de passe de l'utilisateur
 *     responses:
 *       200:
 *         description: L'inscription a réussi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Message de confirmation d'inscription
 *       400:
 *         description: L'e-mail est déjà utilisé
 *       500:
 *         description: Une erreur est survenue
 */

app.post('/inscription', async (req, res) => {
    const { email, mot_de_passe } = req.body;
  
    // Vérification si l'e-mail existe déjà en base de données
    db.get('SELECT email FROM utilisateurs WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.error(err);
        res.status(500).send('Une erreur est survenue.');
      } else if (row) {
        res.status(400).send('Cet e-mail est déjà utilisé.');
      } else {
        // Cryptage du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(mot_de_passe, salt);
  
        // Génération du token d'authentification
        const token = Math.random().toString(36).substr(2);
  
        // Envoi du QR Code en pièce jointe avec le token d'authentification
        const qrCode = await qr.toDataURL(token);
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'payetonkawa667@gmail.com',
            pass: 'zgvjvojqxzzuiohf'
          }
        });
        const mailOptions = {
          from: 'payetonkawa667@gmail.com',
          to: email,
          subject: 'Inscription à l\'API',
          html: `<p>Veuillez scanner le code QR ci-dessous pour vous connecter à l'API.</p>`,
          attachments: [{
            filename: 'qrcode.png',
            content: Buffer.from(qrCode.split(',')[1], 'base64'),
            encoding: 'base64'
          }]
        };
        transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.error(error);
            res.status(500).send('Une erreur est survenue.');
          } else {
            console.log('E-mail envoyé: ' + info.response);
  
            // Insertion de l'utilisateur en base de données
            db.run('INSERT INTO utilisateurs (email, mot_de_passe, token) VALUES (?, ?, ?)', [email, hash, token], err => {
              if (err) {
                console.error(err);
                res.status(500).send('Une erreur est survenue.');
              } else {
                res.send(`Un e-mail contenant un QR Code a été envoyé à l'adresse ${email}.`);
              }
            });
          }
        });
      }
    });
  });
  
/**
 * @openapi
 * /authentification:
 *   post:
 *     summary: Authentification d'un utilisateur
 *     description: Authentifie un utilisateur en vérifiant son e-mail et son mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: L'e-mail de l'utilisateur
 *               mot_de_passe:
 *                 type: string
 *                 description: Le mot de passe de l'utilisateur
 *     responses:
 *       200:
 *         description: Le token d'authentification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Le token d'authentification
 *       401:
 *         description: L'e-mail ou le mot de passe est incorrect.
 *       500:
 *         description: Une erreur est survenue.
 */
// Route pour l'authentification d'un utilisateur
app.post('/authentification', async (req, res) => {
  const { email, mot_de_passe } = req.body;

  // Récupération de l'utilisateur correspondant à l'e-mail
  db.get('SELECT * FROM utilisateurs WHERE email = ?', [email], async (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).send('Une erreur est survenue.');
    } else if (!row) {
      res.status(401).send('L\'e-mail ou le mot de passe est incorrect.');
    } else {
      // Vérification du mot de passe
      const isMatch = await bcrypt.compare(mot_de_passe, row.mot_de_passe);
      if (!isMatch) {
        res.status(401).send('L\'e-mail ou le mot de passe est incorrect.');
      } else {
        // Renvoi du token d'authentification
        res.send({ token: row.token });
      }
    }
  });
});





/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: Afficher la documentation Swagger
 *     description: Affiche la documentation Swagger de l'API
 *     responses:
 *       200:
 *         description: La documentation Swagger
 */
app.get('/api-docs', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
app.listen(3000, () => {
    console.log(`Serveur démarré sur le port ${3000}`);
  });
  
module.exports = app; // Export de l'application pour les tests
//


const assert = require('assert');
const request = require('supertest');
const app = require('../app');
const db = require('../test-db');


function createTables(done) {
  db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS produits`);
    db.run(`CREATE TABLE produits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT,
      description TEXT,
      prix REAL
    )`);

    db.run(`DROP TABLE IF EXISTS medias`);
    db.run(`CREATE TABLE medias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produit_id INTEGER,
      type TEXT,
      url TEXT,
      FOREIGN KEY (produit_id) REFERENCES produits(id)
    )`);

    db.run(`DROP TABLE IF EXISTS utilisateurs`);
    db.run(`CREATE TABLE utilisateurs (
      email TEXT PRIMARY KEY,
      mot_de_passe TEXT,
      token TEXT
    )`);

    db.run(`DROP TABLE IF EXISTS stock`);
    db.run(`CREATE TABLE stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produit_id INTEGER,
      quantite INTEGER,
      FOREIGN KEY (produit_id) REFERENCES produits(id)
    )`, done);
  });
}

beforeEach(done => {
  createTables(done);
});

afterEach(done => {
  db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS produits`);
    db.run(`DROP TABLE IF EXISTS medias`);
    db.run(`DROP TABLE IF EXISTS utilisateurs`);
    db.run(`DROP TABLE IF EXISTS stock`, done);
  });
});


describe('Route "/produits"', () => {

  it('should add a product', done => {
    const produit = {
      nom: 'T-shirt rouge',
      description: 'Un t-shirt rouge en coton',
      prix: 19.99,
      stock: [
        {
          quantite: 10
        }
      ],
      medias: [
        {
          type: 'image',
          url: 'https://example.com/images/tshirt-rouge.jpg'
        },
        {
          type: 'video',
          url: 'https://example.com/videos/tshirt-rouge.mp4'
        }
      ]
    };

    request(app)
      .post('/produits')
      .send(produit)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          assert.equal(res.text, 'Produit ajouté!');
          done();
        }
      });
  });
});

describe('Route "/inscription"', () => {
  
 /* it('should register a new user', done => {
    const user = {
      email: 'test@example.com',
      mot_de_passe: 'testpassword'
    };

    request(app)
      .post('/inscription')
      .send(user)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          assert.ok(res.text.includes('Un e-mail contenant un QR Code a été envoyé'));
          done();
        }
      });
  });
*/
  it('should return an error if email is already used', done => {
    const user = {
      email: 'test@example.com',
      mot_de_passe: 'testpassword'
    };

    request(app)
      .post('/inscription')
      .send(user)
      .end(() => {
        request(app)
          .post('/inscription')
          .send(user)
          .expect(400, done);
      });
  });
});


/*describe('Route "/produits/:id"', () => {
  it('should return a product by id', done => {
    const id = 1;
    request(app)
      .get(`/produits/${id}`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          assert.equal(res.body.id, id);
          done();
        }
      });
  });
});
*/
describe('Route "/produits"', () => {

  it('should return a list of products if authenticated', done => {
    // Ajouter un utilisateur avec un token dans la base de données
    db.run(`INSERT INTO utilisateurs (email, mot_de_passe, token) VALUES ('test@test.com', 'password', 'e6fr6nt86ae')`, err => {
      if (err) {
        done(err);
        return;
      }
      
      // Faire une requête GET avec le token dans la query string
      request(app)
        .get('/produits?token_Authentification=e6fr6nt86ae')
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            assert.ok(res.body.length > 0);
            done();
          }
        });
    });
  });

  it('should return an error if not authenticated', done => {
    request(app)
      .get('/produits')
      .expect(401)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          assert.strictEqual(res.text, 'L\'utilisateur n\'est pas authentifié.');
          done();
        }
      });
  });
})

describe('Route "/authentification"', () => {

  it('should return a token', done => {
    const user = {
      email: 'fakrimougni@gmail.com',
      mot_de_passe: 'payetonkawaaaaa'
    };

    request(app)
      .post('/authentification')
      .send(user)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          assert.ok(res.body.token);
          done();
        }
      });
  });

  it('should return an error if the email is incorrect', done => {
    const user = {
      email: 'wrong@test.com',
      mot_de_passe: 'password'
    };

    request(app)
      .post('/authentification')
      .send(user)
      .expect(401, done);
  });

  it('should return an error if the password is incorrect', done => {
    const user = {
      email: 'test@test.com',
      mot_de_passe: 'wrongpassword'
    };

    request(app)
      .post('/authentification')
      .send(user)
      .expect(401, done);
  });
});



const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mon API',
      version: '1.0.0',
      description: 'Documentation de l\'API'
    }
  },
  apis: ['app.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;

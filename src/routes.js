const { getCourier, createOrder } = require('./controllers/driverController');

function setupRoutes(app) {
  app.get('/couriers/:courierId', getCourier);
  app.post('/order', createOrder);
}

module.exports = { setupRoutes };
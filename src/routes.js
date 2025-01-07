const { getDriver, createOrder } = require('./controllers/driverController');

function setupRoutes(app) {
  app.get('/drivers/:driverId', getDriver);
  app.post('/order', createOrder);
}

module.exports = { setupRoutes }; 
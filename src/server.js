require('dotenv').config();
const express = require('express');
const { setupRoutes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Setup routes
setupRoutes(app);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
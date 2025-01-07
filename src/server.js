require('dotenv').config();
const express = require('express');
const path = require('path');
const { setupRoutes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Setup API routes
setupRoutes(app);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
// Import required modules
const express = require("express");
require("dotenv").config();
const sanitize = require("sanitize");
const path = require("path");

// App initialization
const app = express();
const port = process.env.PORT || 5000;

const cors = require('cors');

const corsOptions = {
  origin: '*', // or process.env.FRONTEND_URL if using .env
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // This is the key!
};

app.use(cors(corsOptions));


// Middleware
app.use(express.json());
app.use(sanitize.middleware);

// Import and mount main router with a base path
const router = require("./routes");
app.use(router); // ✅ Add a base path to prevent path-to-regexp error
// Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});

module.exports = app;

// express app entry point
const express = require('express');
const cors = require('cors');
const { auth, health } = require('./routes');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', health);
app.use('/api', auth);

module.exports = app;


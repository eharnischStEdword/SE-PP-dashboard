const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const transactionsRoutes = require('./routes/transactions');

// Routes
app.use('/api/transactions', transactionsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Church Fund Dashboard API is running' 
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Church Fund Dashboard API',
    endpoints: {
      health: '/health',
      transactions: '/api/transactions/fund/:fundId',
      summary: '/api/transactions/fund/:fundId/summary'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

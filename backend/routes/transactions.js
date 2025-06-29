const express = require('express');
const router = express.Router();
const pushpayAuth = require('../services/pushpayAuth');

// Get transactions for a specific fund
router.get('/fund/:fundId', async (req, res) => {
  try {
    const { fundId } = req.params;
    const { fromDate, toDate, limit = 50 } = req.query;
    
    const merchantKey = process.env.PUSHPAY_MERCHANT_KEY;
    
    if (!merchantKey) {
      return res.status(500).json({ 
        error: 'Merchant key not configured. Please set PUSHPAY_MERCHANT_KEY environment variable.' 
      });
    }
    
    let endpoint = `/merchant/${merchantKey}/payments?`;
    const params = new URLSearchParams({
      fund: fundId,
      orderBy: 'CreatedOn desc',
      take: limit
    });
    
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    
    endpoint += params.toString();
    
    const response = await pushpayAuth.makeAuthenticatedRequest(endpoint);
    
    // Transform data for frontend
    const transactions = response.data.items.map(payment => ({
      id: payment.transactionId,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      donor: payment.payer?.fullName || 'Anonymous',
      date: payment.createdOn,
      status: payment.status,
      fund: payment.fund?.name,
      reference: payment.reference
    }));
    
    res.json({
      transactions,
      totalCount: response.data.totalCount,
      hasMore: response.data.page < response.data.totalPages
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: error.message 
    });
  }
});

// Get fund summary statistics
router.get('/fund/:fundId/summary', async (req, res) => {
  try {
    const { fundId } = req.params;
    const { period = '30' } = req.query; // days
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));
    
    const merchantKey = process.env.PUSHPAY_MERCHANT_KEY;
    
    if (!merchantKey) {
      return res.status(500).json({ 
        error: 'Merchant key not configured. Please set PUSHPAY_MERCHANT_KEY environment variable.' 
      });
    }
    
    const endpoint = `/merchant/${merchantKey}/payments?fund=${fundId}&from=${fromDate.toISOString()}&orderBy=CreatedOn desc&take=1000`;
    
    const response = await pushpayAuth.makeAuthenticatedRequest(endpoint);
    
    const transactions = response.data.items;
    const totalAmount = transactions.reduce((sum, payment) => sum + payment.amount.amount, 0);
    const averageAmount = transactions.length > 0 ? totalAmount / transactions.length : 0;
    
    // Group by day for chart data
    const dailyTotals = {};
    transactions.forEach(payment => {
      const date = new Date(payment.createdOn).toISOString().split('T')[0];
      dailyTotals[date] = (dailyTotals[date] || 0) + payment.amount.amount;
    });
    
    res.json({
      totalAmount,
      averageAmount,
      transactionCount: transactions.length,
      dailyTotals,
      period: parseInt(period)
    });
    
  } catch (error) {
    console.error('Error fetching fund summary:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch fund summary',
      details: error.message 
    });
  }
});

module.exports = router;

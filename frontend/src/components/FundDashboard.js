import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import TransactionsList from './TransactionsList';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:10000/api';

function FundDashboard() {
  const [fundId, setFundId] = useState('');
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(30);

  const fetchFundData = async () => {
    if (!fundId) {
      setError('Please enter a Fund ID');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch summary and transactions concurrently
      const [summaryRes, transactionsRes] = await Promise.all([
        axios.get(`${API_BASE}/transactions/fund/${fundId}/summary?period=${period}`),
        axios.get(`${API_BASE}/transactions/fund/${fundId}?limit=100`)
      ]);
      
      setSummary(summaryRes.data);
      setTransactions(transactionsRes.data.transactions);
    } catch (error) {
      console.error('Error fetching fund data:', error);
      setError(error.response?.data?.error || 'Failed to fetch fund data');
    } finally {
      setLoading(false);
    }
  };

  const chartData = summary ? {
    labels: Object.keys(summary.dailyTotals).sort(),
    datasets: [
      {
        label: 'Daily Donations',
        data: Object.keys(summary.dailyTotals)
          .sort()
          .map(date => summary.dailyTotals[date]),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Fund Activity - Last ${period} Days`
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Church Fund Activity Dashboard
      </Typography>
      
      {/* Fund Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Fund ID"
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              placeholder="Enter PushPay Fund ID"
              error={!!error && !fundId}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              select
              label="Period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchFundData}
              disabled={!fundId || loading}
            >
              {loading ? 'Loading...' : 'Load Data'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {summary && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Amount
                  </Typography>
                  <Typography variant="h5">
                    ${summary.totalAmount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Transaction Count
                  </Typography>
                  <Typography variant="h5">
                    {summary.transactionCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Amount
                  </Typography>
                  <Typography variant="h5">
                    ${summary.averageAmount.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Period
                  </Typography>
                  <Typography variant="h5">
                    {summary.period} Days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Chart */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ height: 400 }}>
              {chartData && <Line data={chartData} options={chartOptions} />}
            </Box>
          </Paper>

          {/* Transactions List */}
          <Paper sx={{ p: 2 }}>
            <TransactionsList transactions={transactions} />
          </Paper>
        </>
      )}
    </Container>
  );
}

export default FundDashboard;

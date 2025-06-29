const axios = require('axios');

class PushPayAuth {
  constructor() {
    this.baseURL = process.env.PUSHPAY_BASE_URL || 'https://sandbox-api.pushpay.com/v1';
    this.clientId = process.env.PUSHPAY_CLIENT_ID;
    this.clientSecret = process.env.PUSHPAY_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('PushPay credentials not configured. Please set PUSHPAY_CLIENT_ID and PUSHPAY_CLIENT_SECRET environment variables.');
    }

    try {
      const response = await axios.post(`${this.baseURL}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'read'
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer

      return this.accessToken;
    } catch (error) {
      console.error('PushPay authentication failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with PushPay');
    }
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    const token = await this.getAccessToken();
    
    return axios({
      ...options,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }
}

module.exports = new PushPayAuth();

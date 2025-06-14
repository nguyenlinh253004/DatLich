const axios = require('axios');

const simulateWebhook = async () => {
  try {
        const response = await axios.post('http://localhost:5000/api/webhooks/webhook-qr', {
        transactionId: 'TRANS-684d9cea06b64fe0bddd9d2c-1749918342835', // Thay bằng paymentId thực tế
        status: 'paid',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    console.log('Webhook simulated:', response.data);
  } catch (error) {
    console.error('Error simulating webhook:', error.message);
  }
};

simulateWebhook();
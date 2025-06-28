const axios = require('axios');

const simulateWebhook = async () => {
  try {
        const response = await axios.post('http://localhost:5000/api/webhooks/webhook-qr', {
        transactionId: 'TRANS-685d0070e65ac441c1128ba5-1750925484501', // Thay bằng paymentId thực tế
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
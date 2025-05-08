const axios = require('axios');

const simulateWebhook = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/webhook-qr', {
      paymentId: 'PAY-your_appointment_id-123456789', // Thay bằng paymentId thực tế từ frontend
      status: 'paid',
    });
    console.log('Webhook simulated:', response.data);
  } catch (error) {
    console.error('Error simulating webhook:', error.message);
  }
};

simulateWebhook();
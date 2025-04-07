// const express = require('express');
// const router = express.Router();
// const stripe = require('stripe')('sk_test_51Qk4QzAXWpwq2jheLqhLlz4dXlNiuQOInjBUvDIpjZzWUOiKUEKW1kCiJCcEy7w1SDTiO9iCpLjhVgeO1gwcvovV00hBJhiX8t'); // Thay bằng Secret Key của bạn

// router.post('/create-payment-intent', async (req, res) => {
//   const { amount, appointmentId } = req.body;

//   try {
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount,
//       currency: 'vnd',
//       metadata: { appointmentId },
//     });

//     res.json({ clientSecret: paymentIntent.client_secret });
//   } catch (err) {
//     res.status(500).json({ message: 'Lỗi khi tạo Payment Intent', error: err });
//   }
// });

// module.exports = router;
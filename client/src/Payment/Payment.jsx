import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useLocation } from 'react-router-dom';

// Khởi tạo Stripe promise
const stripePromise = loadStripe('pk_test_51Qk4QzAXWpwq2jheKEdiVhbxMMdLNrKYUOyZrMUzbnoKV0YXkJYdIkgw3H5x9OZZ9FdZ3pCFoddAYx9IVNTozsRY00NZIvMrZe');

const PaymentForm = ({ appointmentId, amount, token, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [qrCode, setQrCode] = useState(null);

  // Hàm tạo mã QR
  const handleGenerateQR = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/payments/create-qr',
        { amount, appointmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQrCode(data.qrCode);
      toast.success('Mã QR đã được tạo. Vui lòng quét để thanh toán.');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tạo mã QR');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe chưa sẵn sàng. Vui lòng thử lại.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/payments/create-payment-intent',
        { amount: amount * 100, appointmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: 'Customer Name' },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        await axios.put(
          `http://localhost:5000/api/appointments/${appointmentId}`,
          { status: 'paid' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Thanh toán thành công! Lịch hẹn đã được xác nhận.');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-md mx-auto p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Thanh toán thành công!</h2>
        <p>Cảm ơn bạn đã thanh toán. Lịch hẹn của bạn đã được xác nhận.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Thanh toán</h2>

      {/* Chọn phương thức thanh toán */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn phương thức thanh toán:</label>
        <select
          value={paymentMethod}
          onChange={(e) => {
            setPaymentMethod(e.target.value);
            setQrCode(null);
          }}
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="card">Thanh toán bằng thẻ (Stripe)</option>
          <option value="qr">Thanh toán bằng mã QR</option>
        </select>
      </div>

      {/* Thanh toán bằng thẻ */}
      {paymentMethod === 'card' && (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': { color: '#aab7c4' },
                  },
                  invalid: { color: '#9e2146' },
                },
              }}
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            disabled={!stripe || loading}
            className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Đang xử lý...' : `Thanh toán ${amount.toLocaleString('vi-VN')} VND`}
          </button>
        </form>
      )}

      {/* Thanh toán bằng mã QR */}
      {paymentMethod === 'qr' && (
        <div>
          {!qrCode ? (
            <button
              onClick={handleGenerateQR}
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-colors ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Đang tạo mã QR...' : 'Tạo mã QR thanh toán'}
            </button>
          ) : (
            <div className="text-center">
              <p className="mb-4">Quét mã QR dưới đây để thanh toán:</p>
              <img src={qrCode} alt="QR Code" className="mx-auto max-w-full h-auto" />
              <p className="mt-4 text-sm text-gray-600">
                Số tiền: {amount.toLocaleString('vi-VN')} VND
              </p>
              <p className="text-sm text-gray-600">
                Nội dung: Thanh toan lich hen {appointmentId}
              </p>
              <button
                onClick={async () => {
                  try {
                    await axios.put(
                      `http://localhost:5000/api/appointments/${appointmentId}`,
                      { status: 'paid' },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setPaymentSuccess(true);
                    toast.success('Thanh toán đã được xác nhận!');
                    if (onSuccess) onSuccess();
                  } catch (err) {
                    setError('Lỗi khi xác nhận thanh toán');
                  }
                }}
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                Xác nhận đã thanh toán
              </button>
            </div>
          )}
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      )}
    </div>
  );
};

const Payment = ({ appointmentId: propAppointmentId, amount: propAmount, token, onSuccess }) => {
  const { id: urlAppointmentId } = useParams(); // Lấy appointmentId từ URL (nếu có)
  const location = useLocation(); // Lấy state từ Link (nếu có)
  
  // Ưu tiên props, nếu không có thì lấy từ URL/state
  const appointmentId = propAppointmentId || urlAppointmentId;
  const amount = propAmount || location.state?.amount || 0;

  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    stripePromise.then(() => setStripeReady(true));
  }, []);

  if (!stripeReady) {
    return (
      <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-lg text-center">
        <p>Đang tải cổng thanh toán...</p>
      </div>
    );
  }

  if (!appointmentId || !amount) {
    return (
      <div className="max-w-md mx-auto p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
        <p>
          {!appointmentId && !amount
            ? 'Thiếu thông tin appointmentId và amount'
            : !appointmentId
            ? 'Thiếu thông tin appointmentId'
            : 'Thiếu thông tin amount'}
        </p>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <Elements stripe={stripePromise}>
        <PaymentForm appointmentId={appointmentId} amount={amount} token={token} onSuccess={onSuccess} />
      </Elements>
    </div>
  );
};

export default Payment;
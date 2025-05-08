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
  const [qrData, setQrData] = useState({
    transactionId: '',
    paymentId: '',
    expiresAt: null,
  });
  const [timeLeft, setTimeLeft] = useState(null);

  // Hàm tạo mã QR
  const handleGenerateQR = async () => {
    if (!amount || amount <= 0) {
      setError('Số tiền không hợp lệ');
      return;
    }
    if (amount < 12000) {
      setError('Số tiền phải lớn hơn 12,000 VND để thanh toán qua mã QR');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/payments/create-qr',
        { amount, appointmentId, paymentMethod: 'qr' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQrCode(data.qrCode);
      setQrData({
        transactionId: data.transactionId || `TRANS-${appointmentId}`,
        paymentId: data.paymentId || `PAY-${appointmentId}`,
        expiresAt: new Date(data.expiresAt), // Lấy từ API
      });

      toast.success('Mã QR đã được tạo. Vui lòng quét để thanh toán.');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(err.response?.data?.message || 'Lỗi khi tạo mã QR');
      }
      toast.error(err.response?.data?.message || 'Lỗi khi tạo mã QR');
    } finally {
      setLoading(false);
    }
  };

  // Đếm ngược thời gian hết hạn mã QR
  useEffect(() => {
    let timer;
    if (qrData.expiresAt) {
      timer = setInterval(() => {
        const now = new Date();
        const expiresAt = new Date(qrData.expiresAt);
        const diff = expiresAt - now;
        if (diff <= 0) {
          setTimeLeft('Hết hạn');
          clearInterval(timer);
        } else {
          const minutes = Math.floor(diff / 1000 / 60);
          const seconds = Math.floor((diff / 1000) % 60);
          setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [qrData.expiresAt]);

  // Kiểm tra trạng thái thanh toán QR tự động
  useEffect(() => {
    let interval;
    if (qrData.paymentId && qrData.expiresAt && !paymentSuccess) {
      interval = setInterval(async () => {
        // Dừng kiểm tra nếu QR hết hạn
        if (new Date() > new Date(qrData.expiresAt)) {
          clearInterval(interval);
          setError('Mã QR đã hết hạn. Vui lòng tạo mã mới.');
          setQrCode(null);
          setQrData({ transactionId: '', paymentId: '', expiresAt: null });
          return;
        }

        try {
          const { data } = await axios.get(
            `http://localhost:5000/api/payments/status/${qrData.paymentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (data.status === 'paid') {
            clearInterval(interval);
            setPaymentSuccess(true);
            toast.success('Thanh toán qua mã QR thành công!');
            if (onSuccess) onSuccess();
          } else if (data.status === 'expired') {
            clearInterval(interval);
            setError('Mã QR đã hết hạn. Vui lòng tạo mã mới.');
            setQrCode(null);
            setQrData({ transactionId: '', paymentId: '', expiresAt: null });
          }
        } catch (err) {
          if (err.response?.status === 401) {
            setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            clearInterval(interval);
          }
          console.error('Lỗi kiểm tra trạng thái:', err);
        }
      }, 5000); // Kiểm tra mỗi 5 giây
    }

    return () => clearInterval(interval);
  }, [qrData.paymentId, qrData.expiresAt, paymentSuccess, token, onSuccess]);

  // Hàm xử lý thanh toán tiền mặt
  const handleCashPayment = async () => {
    if (!amount || amount <= 0) {
      setError('Số tiền không hợp lệ');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/payments/create-payment-intent',
        { amount, appointmentId, paymentMethod: 'cash' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Lưu paymentId để hiển thị mã thanh toán
      setQrData({
        paymentId: `CASH-${appointmentId}-${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h hết hạn
      });

      toast.success(data.message);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(err.response?.data?.message || 'Lỗi khi chọn thanh toán tiền mặt');
      }
      toast.error(err.response?.data?.message || 'Lỗi khi chọn thanh toán tiền mặt');
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý thanh toán Stripe
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe chưa sẵn sàng. Vui lòng thử lại.');
      return;
    }

    if (!amount || amount <= 0) {
      setError('Số tiền không hợp lệ');
      return;
    }
    if (amount < 12000) {
      setError('Số tiền phải lớn hơn 12,000 VND để thanh toán qua Stripe');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/payments/create-payment-intent',
        { amount, appointmentId, paymentMethod: 'online' },
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
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(err.response?.data?.message || 'Lỗi khi thanh toán');
      }
      toast.error(err.response?.data?.message || 'Lỗi khi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-md mx-auto p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Xác nhận thành công!</h2>
        <p>
          {paymentMethod === 'cash'
            ? 'Lịch hẹn của bạn đã được đặt. Vui lòng thanh toán bằng tiền mặt tại cửa hàng.'
            : paymentMethod === 'qr'
            ? 'Thanh toán qua mã QR đã được xác nhận. Lịch hẹn của bạn đã được xác nhận.'
            : 'Cảm ơn bạn đã thanh toán. Lịch hẹn của bạn đã được xác nhận.'}
        </p>
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
            setQrData({ transactionId: '', paymentId: '', expiresAt: null });
            setTimeLeft(null);
          }}
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="card">Thanh toán bằng thẻ (Stripe)</option>
          <option value="qr">Thanh toán bằng mã QR</option>
          <option value="cash">Thanh toán tiền mặt</option>
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
              <img src={qrCode} alt="QR Code" className="mx-auto max-w-full h-auto border rounded-lg p-2" />

              <div className="mt-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Số tiền:</span> {amount.toLocaleString('vi-VN')} VND
                </p>
                <p className="text-sm">
                  <span className="font-medium">Mã giao dịch:</span> {qrData.transactionId}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Nội dung:</span> Thanh toán lịch hẹn {appointmentId}
                </p>
                {qrData.expiresAt && (
                  <p className="text-sm text-orange-600">
                    Thời gian còn lại: {timeLeft || 'Đang tính...'}
                  </p>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Sau khi thanh toán, hệ thống sẽ tự động xác nhận. Nếu có vấn đề, vui lòng liên hệ hỗ trợ:<br />
                  Email: support@example.com<br />
                  Số điện thoại: 0123 456 789
                </p>
              </div>
            </div>
          )}
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      )}

      {/* Thanh toán tiền mặt */}
      {paymentMethod === 'cash' && (
        <div className="text-center">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Hướng dẫn thanh toán tiền mặt</h3>
            <p className="text-sm text-gray-600">
              Vui lòng đến cửa hàng để thanh toán trong vòng 24 giờ
            </p>
            <p className="text-sm mt-2">
              <span className="font-medium">Địa chỉ:</span> 123 Đường ABC, Quận 1, TP. HCM
            </p>
            <p className="text-sm">
              <span className="font-medium">Giờ mở cửa:</span> 8:00 - 17:00 (Thứ 2 - Thứ 7)
            </p>
          </div>

          {qrData.paymentId && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium">Mã thanh toán: {qrData.paymentId}</p>
              <p className="text-sm mt-1">Vui lòng cung cấp mã này khi thanh toán</p>
            </div>
          )}

          <button
            onClick={handleCashPayment}
            disabled={loading || qrData.paymentId}
            className={`w-full mt-4 py-2 px-4 rounded-md text-white font-semibold transition-colors ${
              loading || qrData.paymentId
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading
              ? 'Đang xử lý...'
              : qrData.paymentId
              ? 'Đã tạo yêu cầu thanh toán'
              : 'Xác nhận thanh toán tiền mặt'}
          </button>

          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      )}
    </div>
  );
};

const Payment = ({ appointmentId: propAppointmentId, amount: propAmount, token, onSuccess }) => {
  const { id: urlAppointmentId } = useParams();
  const location = useLocation();

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
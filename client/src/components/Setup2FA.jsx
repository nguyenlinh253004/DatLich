import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Setup2FA = ({ token }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [otp, setOtp] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const fetch2FAStatus = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/2fa-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIs2FAEnabled(res.data.is2FAEnabled);
    } catch (err) {
      toast.error('Không thể kiểm tra trạng thái 2FA');
    }
  };

  useEffect(() => {
    fetch2FAStatus();
  }, [token]);

  const handleSetup2FA = async () => {
    try {
      const res = await axios.post(
        'http://localhost:5000/api/setup-2fa',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQrCodeUrl(res.data.qrCodeUrl);
      setSecret(res.data.secret);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thiết lập 2FA');
    }
  };

  const handleVerify2FA = async () => {
    try {
      await axios.post(
        'http://localhost:5000/api/verify-2fa',
        { token: otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Kích hoạt 2FA thành công');
      setIs2FAEnabled(true);
      setQrCodeUrl('');
      setSecret('');
      setOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xác minh 2FA thất bại');
    }
  };

  const handleDisable2FA = async () => {
    try {
      await axios.post(
        'http://localhost:5000/api/disable-2fa',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Tắt 2FA thành công');
      setIs2FAEnabled(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tắt 2FA thất bại');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Thiết lập xác thực 2 yếu tố (2FA)</h2>
      {is2FAEnabled ? (
        <div>
          <p className="text-green-600 mb-4">2FA đã được kích hoạt.</p>
          <button
            onClick={handleDisable2FA}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
          >
            Tắt 2FA
          </button>
        </div>
      ) : (
        <div>
          {!qrCodeUrl ? (
            <button
              onClick={handleSetup2FA}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Kích hoạt 2FA
            </button>
          ) : (
            <div>
              <p className="mb-4">Quét mã QR bằng ứng dụng xác thực (Google Authenticator, Authy, v.v.):</p>
              <img src={qrCodeUrl} alt="QR Code" className="mb-4" />
              <p className="mb-4">Hoặc nhập mã thủ công: <strong>{secret}</strong></p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nhập mã OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Nhập mã 6 chữ số"
                />
              </div>
              <button
                onClick={handleVerify2FA}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Xác minh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Setup2FA;
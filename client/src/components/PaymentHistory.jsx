import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

// Tách thành component riêng để tái sử dụng
const PaymentStatusBadge = ({ status }) => {
  const statusConfig = {
    paid: { text: 'Thành công', className: 'bg-green-50 text-green-700 border-green-200' },
    failed: { text: 'Thất bại', className: 'bg-red-50 text-red-700 border-red-200' },
    refunded: { text: 'Hoàn tiền', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    pending: { text: 'Đang xử lý', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    expired: { text: 'Hết hạn', className: 'bg-gray-50 text-gray-700 border-gray-200' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      {config.text}
    </span>
  );
};

PaymentStatusBadge.propTypes = {
  status: PropTypes.oneOf(['paid', 'failed', 'pending', 'refunded', 'expired']).isRequired
};

const PaymentHistory = ({ token }) => {
  const [data, setData] = useState({
    payments: [],
    total: 0,
    page: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPaymentHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: data.limit
        }
      });
      
      setData(prev => ({
        ...prev,
        payments: res.data.data || [],
        total: res.data.pagination?.total || 0,
        page
      }));
    } catch (err) {
      console.error('Fetch payment history error:', err);
      setError(err.response?.data?.message || 'Không thể tải lịch sử thanh toán');
      toast.error(err.response?.data?.message || 'Lỗi khi tải lịch sử thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, [token]);

  const handlePageChange = (newPage) => {
    fetchPaymentHistory(newPage);
  };

  if (loading && data.payments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 font-roboto mt-10">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 font-roboto mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Lịch sử thanh toán</h2>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center mb-4">
          {error}
          <button 
            onClick={() => fetchPaymentHistory()}
            className="ml-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700"
          >
            Thử lại
          </button>
        </div>
      ) : null}

      {data.payments.length === 0 && !loading ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 p-6 rounded-lg text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium">Không có giao dịch nào</h3>
          <p className="mt-1 text-gray-500">Bạn chưa thực hiện giao dịch nào.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Table Header */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Ngày giao dịch</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Dịch vụ</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Số tiền</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Phương thức</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="divide-y divide-gray-200">
                {data.payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 transition duration-200">
                    <td className="py-4 px-6 whitespace-nowrap">
                      {moment(payment.createdAt).format('DD/MM/YYYY HH:mm')}
                    </td>
                    <td className="py-4 px-6">
                      {payment.appointmentId?.service || 'Không xác định'}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {payment.amount?.toLocaleString('vi-VN')} VNĐ
                    </td>
                    <td className="py-4 px-6 capitalize">
                      {payment.method?.replace('_', ' ') || 'Không xác định'}
                    </td>
                    <td className="py-4 px-6">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.total > data.limit && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Hiển thị {(data.page - 1) * data.limit + 1}-
                {Math.min(data.page * data.limit, data.total)} của {data.total} giao dịch
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(data.page - 1)}
                  disabled={data.page === 1}
                  className={`px-3 py-1 rounded border ${data.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Trước
                </button>
                <button
                  onClick={() => handlePageChange(data.page + 1)}
                  disabled={data.page * data.limit >= data.total}
                  className={`px-3 py-1 rounded border ${data.page * data.limit >= data.total ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

PaymentHistory.propTypes = {
  token: PropTypes.string.isRequired
};

export default React.memo(PaymentHistory);
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Stats = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data.data);
        setLoading(false);
      } catch (err) {
        toast.error('Không thể tải thống kê');
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) return <div>Đang tải...</div>;
  if (!stats) return <div>Không có dữ liệu thống kê</div>;

  return (
    <div className="container mx-auto px-4 py-8 mt-10">
      <h2 className="text-2xl font-bold mb-6">Thống kê</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold">Tổng số lịch hẹn</h3>
          <p className="text-2xl font-bold">{stats.totalAppointments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold">Lịch hẹn đã xác nhận</h3>
          <p className="text-2xl font-bold">{stats.confirmedAppointments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold">Lịch hẹn chờ xác nhận</h3>
          <p className="text-2xl font-bold">{stats.pendingAppointments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold">Lịch hẹn đã thanh toán</h3>
          <p className="text-2xl font-bold">{stats.paidAppointments}</p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
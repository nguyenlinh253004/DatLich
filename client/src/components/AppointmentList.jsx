import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactPaginate from 'react-paginate';
import * as XLSX from 'xlsx';
import { Link } from 'react-router-dom';
import moment from 'moment';

const AppointmentList = ({ token, isAdmin = false }) => {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [confirmationFilter, setConfirmationFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formData, setFormData] = useState({});

  const [exportColumns, setExportColumns] = useState({
    service: true,
    date: true,
    name: true,
    status: true,
    paymentStatus: true,
    confirmed: true,
  });

  const itemsPerPage = 5;

  const fetchServices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/services');
      setServices(res.data);
    } catch (error) {
      toast.error('Không thể tải danh sách dịch vụ');
    }
  };

  const fetchAppointments = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/appointments', {
        params: { 
          page,
          limit: itemsPerPage,
          search: searchTerm,
          status: statusFilter,
          paymentStatus: paymentStatusFilter,
          confirmed: confirmationFilter
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('API Response:', res.data);
      
      setAppointments(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(currentPage + 1);
    fetchServices();
  }, [token, searchTerm, statusFilter, paymentStatusFilter, confirmationFilter, currentPage]);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn hủy lịch hẹn này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Hủy lịch thành công');
        fetchAppointments(currentPage + 1);
      } catch (error) {
        toast.error('Hủy lịch thất bại');
      }
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment._id);
    setFormData({
      service: appointment.service,
      date: moment(appointment.date).format('YYYY-MM-DDTHH:mm'),
      name: appointment.name,
      phone: appointment.phone,
      email: appointment.email,
      note: appointment.note,
    });
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/appointments/${id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cập nhật lịch hẹn thành công');
      setEditingAppointment(null);
      fetchAppointments(currentPage + 1);
    } catch (error) {
      toast.error('Cập nhật lịch hẹn thất bại');
    }
  };

  const handleConfirm = async (id, confirmed) => {
    if (window.confirm(`Bạn có chắc muốn ${confirmed === 'confirmed' ? 'xác nhận' : 'từ chối'} lịch hẹn này?`)) {
      try {
        await axios.put(
          `http://localhost:5000/api/appointments/${id}/confirm`,
          { confirmed },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(`${confirmed === 'confirmed' ? 'Xác nhận' : 'Từ chối'} lịch hẹn thành công`);
        fetchAppointments(currentPage + 1);
      } catch (error) {
        toast.error(`${confirmed === 'confirmed' ? 'Xác nhận' : 'Từ chối'} lịch hẹn thất bại`);
      }
    }
  };

  const getServicePrice = (serviceName) => {
    const service = services.find((s) => s.name === serviceName);
    return service ? service.price : 0;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = sortConfig.key === 'date' ? new Date(a[sortConfig.key]) : a[sortConfig.key];
    const bValue = sortConfig.key === 'date' ? new Date(b[sortConfig.key]) : b[sortConfig.key];
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const pageCount = Math.ceil(total / itemsPerPage);

  const getTimeStatus = (date) => {
    const now = new Date();
    const apptDate = new Date(date);
    return apptDate > now ? 'Sắp tới' : 'Đã qua';
  };

  const getPaymentStatus = (status) => {
    return status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
  };

  const getConfirmationStatus = (confirmed) => {
    switch (confirmed) {
      case 'confirmed':
        return 'Đã phê duyệt';
      case 'rejected':
        return 'Đã từ chối';
      default:
        return 'Đang phê duyệt';
    }
  };

  const getStatusStyle = (date) => {
    const now = new Date();
    const apptDate = new Date(date);
    return apptDate > now
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-red-50 text-red-700 border-red-200';
  };

  const getPaymentStatusStyle = (status) => {
    return status === 'paid'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };

  const getConfirmationStatusStyle = (confirmed) => {
    switch (confirmed) {
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handlePageClick = (event) => {
    const newPage = event.selected;
    setCurrentPage(newPage);
  };

  const exportToExcel = () => {
    const data = sortedAppointments.map((appt) => {
      const row = {};
      if (exportColumns.service) row['Dịch vụ'] = appt.service;
      if (exportColumns.date) row['Thời gian'] = new Date(appt.date).toLocaleString();
      if (exportColumns.name) row['Họ tên'] = appt.name;
      if (exportColumns.status) row['Trạng thái thời gian'] = getTimeStatus(appt.date);
      if (exportColumns.paymentStatus) row['Trạng thái thanh toán'] = getPaymentStatus(appt.status);
      if (exportColumns.confirmed) row['Trạng thái xác nhận'] = getConfirmationStatus(appt.confirmed);
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lịch hẹn');
    XLSX.writeFile(wb, 'LichHen.xlsx');
  };

  return (
    <div className="container mx-auto px-4 py-8 font-roboto mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Danh sách lịch hẹn</h2>

      {/* Bộ lọc */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative flex-1 mb-4 md:mb-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Tìm kiếm theo dịch vụ hoặc họ tên..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(0);
          }}
          className="w-full md:w-48 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 mb-4 md:mb-0"
        >
          <option value="all">Tất cả (Thời gian)</option>
          <option value="upcoming">Sắp tới</option>
          <option value="past">Đã qua</option>
        </select>
        <select
          value={paymentStatusFilter}
          onChange={(e) => {
            setPaymentStatusFilter(e.target.value);
            setCurrentPage(0);
          }}
          className="w-full md:w-48 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 mb-4 md:mb-0"
        >
          <option value="all">Tất cả (Thanh toán)</option>
          <option value="pending">Chưa thanh toán</option>
          <option value="paid">Đã thanh toán</option>
        </select>
        <select
          value={confirmationFilter}
          onChange={(e) => {
            setConfirmationFilter(e.target.value);
            setCurrentPage(0);
          }}
          className="w-full md:w-48 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 mb-4 md:mb-0"
        >
          <option value="all">Tất cả (Xác nhận)</option>
          <option value="pending">Đang phê duyệt</option>
          <option value="confirmed">Đã phê duyệt</option>
          <option value="rejected">Đã từ chối</option>
        </select>
        <button
          onClick={exportToExcel}
          className="w-full md:w-auto px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 shadow-sm"
        >
          Xuất Excel
        </button>
      </div>

      {/* Checkbox chọn cột để xuất */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Chọn cột để xuất Excel:</h3>
        <div className="flex flex-wrap gap-4">
          {Object.keys(exportColumns).map((key) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={exportColumns[key]}
                onChange={(e) => setExportColumns({ ...exportColumns, [key]: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {key === 'service'
                  ? 'Dịch vụ'
                  : key === 'date'
                  ? 'Thời gian'
                  : key === 'name'
                  ? 'Họ tên'
                  : key === 'status'
                  ? 'Trạng thái thời gian'
                  : key === 'paymentStatus'
                  ? 'Trạng thái thanh toán'
                  : 'Trạng thái xác nhận'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Bảng lịch hẹn */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          <p className="ml-4 text-gray-600 text-lg">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
          {error}
        </div>
      ) : sortedAppointments.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 p-6 rounded-lg text-center">
          Không tìm thấy lịch hẹn nào.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('service')}
                    className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition duration-200"
                  >
                    Dịch vụ {sortConfig.key === 'service' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('date')}
                    className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition duration-200"
                  >
                    Thời gian {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition duration-200"
                  >
                    Họ tên {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                    Trạng thái thời gian
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                    Trạng thái thanh toán
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                    Trạng thái xác nhận
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedAppointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-gray-50 transition duration-200">
                    {editingAppointment === appt._id ? (
                      <>
                        <td className="py-4 px-6">
                          <select
                            name="service"
                            value={formData.service}
                            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                          >
                            {services.map((s) => (
                              <option key={s._id} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 px-6">
                          <input
                            type="datetime-local"
                            name="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <input
                            type="text"
                            name="note"
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                          />
                        </td>
                        <td className="py-4 px-6 flex space-x-3">
                          <button
                            onClick={() => handleUpdate(appt._id)}
                            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 shadow-sm"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingAppointment(null)}
                            className="inline-block px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 shadow-sm"
                          >
                            Hủy
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={`py-4 px-6 ${getStatusStyle(appt.date)}`}>{appt.service}</td>
                        <td className={`py-4 px-6 ${getStatusStyle(appt.date)}`}>
                          {new Date(appt.date).toLocaleString()}
                        </td>
                        <td className={`py-4 px-6 ${getStatusStyle(appt.date)}`}>{appt.name}</td>
                        <td className={`py-4 px-6 ${getStatusStyle(appt.date)} relative group`}>
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium">
                            {getTimeStatus(appt.date)}
                          </span>
                          <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-3 -top-10 left-1/2 transform -translate-x-1/2 shadow-lg transition-opacity duration-200">
                            {`Thời gian: ${new Date(appt.date).toLocaleString()}`}
                          </div>
                        </td>
                        <td className={`py-4 px-6 ${getPaymentStatusStyle(appt.status)}`}>
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium">
                            {getPaymentStatus(appt.status)}
                          </span>
                        </td>
                        <td className={`py-4 px-6 ${getConfirmationStatusStyle(appt.confirmed)}`}>
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium">
                            {getConfirmationStatus(appt.confirmed)}
                          </span>
                        </td>
                        <td className="py-4 px-6 flex space-x-3">
                          {isAdmin && (
                            <>
                              {appt.confirmed === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleConfirm(appt._id, 'confirmed')}
                                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 shadow-sm"
                                  >
                                    Xác nhận
                                  </button>
                                  <button
                                    onClick={() => handleConfirm(appt._id, 'rejected')}
                                    className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 shadow-sm"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleEdit(appt)}
                                className="inline-block px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-200 shadow-sm"
                              >
                                Sửa
                              </button>
                            </>
                          )}
                          {!isAdmin && appt.status === 'pending' && (
                            <Link
                              to={`/payment/${appt._id}`}
                              state={{ amount: getServicePrice(appt.service) }}
                              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
                            >
                              Thanh toán
                            </Link>
                          )}
                          <button
                            onClick={() => handleDelete(appt._id)}
                            className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 shadow-sm"
                          >
                            Hủy
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {pageCount > 1 && (
            <div className="mt-6 flex justify-center">
              <ReactPaginate
                previousLabel={
                  <span className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Trước
                  </span>
                }
                nextLabel={
                  <span className="flex items-center">
                    Sau
                    <svg
                      className="w-5 h-5 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                }
                breakLabel={'...'}
                pageCount={pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={3}
                onPageChange={handlePageClick}
                containerClassName={'flex items-center space-x-2'}
                pageClassName={
                  'px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition duration-200'
                }
                activeClassName={'bg-blue-600 text-white hover:bg-blue-600'}
                previousClassName={
                  'px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition duration-200 flex items-center'
                }
                nextClassName={
                  'px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition duration-200 flex items-center'
                }
                breakClassName={'px-4 py-2 text-gray-700'}
                disabledClassName={'bg-gray-300 cursor-not-allowed text-gray-500 hover:bg-gray-300'}
                forcePage={currentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentList;
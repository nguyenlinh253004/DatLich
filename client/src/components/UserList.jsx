import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactPaginate from 'react-paginate';

const UserList = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/users`, {
        params: { page, limit: itemsPerPage, search: searchTerm },
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, searchTerm]);

  const handlePageClick = (event) => {
    const newPage = event.selected + 1;
    setCurrentPage(event.selected);
    fetchUsers(newPage);
  };

  const handleRoleChange = async (userId, newRole) => {
    if (window.confirm(`Bạn có chắc muốn thay đổi vai trò thành ${newRole}?`)) {
      try {
        await axios.put(
          `http://localhost:5000/api/users/${userId}/role`,
          { role: newRole },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Cập nhật vai trò thành công');
        fetchUsers(currentPage + 1);
      } catch (err) {
        toast.error('Cập nhật vai trò thất bại');
      }
    }
  };

  const handleLockToggle = async (userId, isLocked) => {
    if (window.confirm(`Bạn có chắc muốn ${isLocked ? 'khóa' : 'mở khóa'} tài khoản này?`)) {
      try {
        await axios.put(
          `http://localhost:5000/api/users/${userId}/lock`,
          { isLocked },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(`${isLocked ? 'Khóa' : 'Mở khóa'} tài khoản thành công`);
        fetchUsers(currentPage + 1);
      } catch (err) {
        toast.error(`${isLocked ? 'Khóa' : 'Mở khóa'} tài khoản thất bại`);
      }
    }
  };

  const pageCount = Math.ceil(total / itemsPerPage);

  return (
    <div className="mt-8 container mx-auto px-4 py-8 font-roboto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Quản lý người dùng</h2>

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
            placeholder="Tìm kiếm theo email..."
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
      </div>

      {/* Bảng người dùng */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          <p className="ml-4 text-gray-600 text-lg">Đang tải...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 p-6 rounded-lg text-center">
          Không tìm thấy người dùng nào.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Vai trò</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Ngày tạo</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition duration-200">
                    <td className="py-4 px-6">{user.email}</td>
                    <td className="py-4 px-6">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          user.isLocked
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        {user.isLocked ? 'Đã khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="py-4 px-6">{new Date(user.createdAt).toLocaleString()}</td>
                    <td className="py-4 px-6 flex space-x-3">
                      <button
                        onClick={() => handleLockToggle(user._id, !user.isLocked)}
                        className={`inline-block px-4 py-2 rounded-lg text-white transition duration-200 shadow-sm ${
                          user.isLocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {user.isLocked ? 'Mở khóa' : 'Khóa'}
                      </button>
                    </td>
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
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserList;
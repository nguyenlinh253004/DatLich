import { Link } from "react-router-dom";
import { 
    UserIcon, 
    CalendarIcon, 
    ChartBarIcon, 
    Cog6ToothIcon as CogIcon
} from '@heroicons/react/24/outline';
import React from "react";

const Dashboard = ({token}) => {
    return (
       
        <>
            {token ? (
                <div className="container mx-auto px-4 py-8 font-roboto mt-10">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Quản lý người dùng */}
                        <Link
                            to="/admin/users"
                            className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 border border-gray-100 hover:border-blue-200"
                        >
                            <div className="flex items-center mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg mr-4">
                                    <UserIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Quản lý người dùng</h3>
                            </div>
                            <p className="text-gray-600 text-sm pl-14">Xem và quản lý danh sách người dùng</p>
                        </Link>

                        {/* Quản lý lịch hẹn */}
                        <Link
                            to="/AppointmentList"
                            className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 border border-gray-100 hover:border-green-200"
                        >
                            <div className="flex items-center mb-4">
                                <div className="p-3 bg-green-50 rounded-lg mr-4">
                                    <CalendarIcon className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Quản lý lịch hẹn</h3>
                            </div>
                            <p className="text-gray-600 text-sm pl-14">Xem và quản lý danh sách lịch hẹn</p>
                        </Link>

                        {/* Lịch biểu */}
                        <Link
                            to="/admin/calendar"
                            className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 border border-gray-100 hover:border-purple-200"
                        >
                            <div className="flex items-center mb-4">
                                <div className="p-3 bg-purple-50 rounded-lg mr-4">
                                    <ChartBarIcon className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Lịch biểu</h3>
                            </div>
                            <p className="text-gray-600 text-sm pl-14">Xem lịch hẹn dưới dạng lịch biểu</p>
                        </Link>

                        {/* Quản lý dịch vụ */}
                        <Link
                            to="/admin/services"
                            className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 border border-gray-100 hover:border-yellow-200"
                        >
                            <div className="flex items-center mb-4">
                                <div className="p-3 bg-yellow-50 rounded-lg mr-4">
                                    <CogIcon className="w-6 h-6 text-yellow-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Quản lý dịch vụ</h3>
                            </div>
                            <p className="text-gray-600 text-sm pl-14">Xem và quản lý danh sách dịch vụ</p>
                        </Link>
                        <Link
                            to="/admin/stats"
                            className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 border border-gray-100 hover:border-yellow-200"
                        >
                            <div className="flex items-center mb-4">
                                <div className="p-3 bg-yellow-50 rounded-lg mr-4">
                                    <CogIcon className="w-6 h-6 text-yellow-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Quản lý thống kê</h3>
                            </div>
                            <p className="text-gray-600 text-sm pl-14">Xem và quản lý thống kê</p>
                        </Link>
                    </div>
              
                </div>
                
            ) : (
                <p className="text-center py-8 text-gray-600 mt-52 font-roboto">Vui lòng đăng nhập để xem dashboard</p>
            )}
            </>
        );
};

export default Dashboard;
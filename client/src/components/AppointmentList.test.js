import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentList from './AppointmentList';
import axios from 'axios';
import { toast } from 'react-toastify';

// Mock các thư viện
jest.mock('axios');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock data
const mockAppointments = [
  {
    _id: '1',
    service: 'Cắt tóc',
    date: new Date(Date.now() + 86400000).toISOString(), // +1 day
    name: 'Nguyễn Văn A',
    phone: '0123456789',
    email: 'a@example.com',
    status: 'pending',
    confirmed: 'pending',
    note: 'Ghi chú 1'
  },
  {
    _id: '2',
    service: 'Nhuộm tóc',
    date: new Date(Date.now() - 86400000).toISOString(), // -1 day
    name: 'Trần Thị B',
    phone: '0987654321',
    email: 'b@example.com',
    status: 'paid',
    confirmed: 'confirmed',
    note: 'Ghi chú 2'
  }
];

const mockServices = [
  { _id: '1', name: 'Cắt tóc', price: 100000 },
  { _id: '2', name: 'Nhuộm tóc', price: 200000 }
];

describe('AppointmentList Component', () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
        if (url.includes('services')) {
          return Promise.resolve({ data: mockServices });
        }
        if (url.includes('appointments/1')) {
          return Promise.resolve({ data: mockAppointments[0] });
        }
        return Promise.resolve({ 
          data: { 
            data: mockAppointments, 
            total: mockAppointments.length 
          } 
        });
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', async () => {
    render(<AppointmentList token="test-token" />);
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });

  test('displays appointments correctly after loading', async () => {
    render(<AppointmentList token="test-token" />);
    
    await waitFor(() => {
      expect(screen.getByText('Cắt tóc')).toBeInTheDocument();
      expect(screen.getByText('Nhuộm tóc')).toBeInTheDocument();
    });
  });

  test('filters appointments by status', async () => {
    render(<AppointmentList token="test-token" />);
    
    await waitFor(() => {
      const statusFilter = screen.getByLabelText('Tất cả (Thời gian)');
      userEvent.selectOptions(statusFilter, 'upcoming');
      
      expect(axios.get).toHaveBeenLastCalledWith(
        'http://localhost:5000/api/appointments',
        expect.objectContaining({
          params: expect.objectContaining({ status: 'upcoming' })
        })
      );
    });
  });

  test('sorts appointments by date', async () => {
    render(<AppointmentList token="test-token" />);
    
    await waitFor(() => {
      const dateHeader = screen.getByText('Thời gian');
      fireEvent.click(dateHeader);
      
      // Kiểm tra logic sort trong component
      const appointments = screen.getAllByRole('row');
      expect(appointments[1]).toHaveTextContent('Cắt tóc'); // Sắp tới lên đầu
    });
  });

  test('allows admin to confirm appointment', async () => {
    axios.put.mockResolvedValueOnce({});
    render(<AppointmentList token="test-token" isAdmin={true} />);
    
    await waitFor(async () => {
      const confirmButtons = screen.getAllByText('Xác nhận');
      userEvent.click(confirmButtons[0]);
      
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/appointments/1/confirm',
        { confirmed: 'confirmed' },
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith('Xác nhận lịch hẹn thành công');
    });
  });

  test('prevents user from canceling confirmed appointment', async () => {
    render(<AppointmentList token="test-token" />);
    
    await waitFor(() => {
      // Lịch đã xác nhận (appointment thứ 2)
      const cancelButtons = screen.getAllByText('Hủy');
      userEvent.click(cancelButtons[1]);
      
      expect(toast.error).toHaveBeenCalledWith('Không thể hủy lịch đã được xác nhận hoặc đã thanh toán');
    });
  });

  test('exports to Excel with selected columns', async () => {
    render(<AppointmentList token="test-token" />);
    
    await waitFor(() => {
      // Bỏ chọn cột "Trạng thái xác nhận"
      const confirmationCheckbox = screen.getByLabelText('Trạng thái xác nhận');
      userEvent.click(confirmationCheckbox);
      
      const exportButton = screen.getByText('Xuất Excel');
      userEvent.click(exportButton);
      
      // Kiểm tra xem chỉ các cột được chọn có trong dữ liệu xuất không
      // (Cần mock thư viện xlsx để kiểm tra chi tiết hơn)
    });
  });
});
describe('Cancel Appointment Logic', () => {
    test('prevents user from canceling paid appointment', async () => {
      render(<AppointmentList token="test-token" />);
      
      await waitFor(() => {
        // Lịch đã thanh toán (appointment thứ 2)
        const cancelButtons = screen.getAllByText('Hủy');
        userEvent.click(cancelButtons[1]);
        
        expect(toast.error).toHaveBeenCalledWith(
          'Không thể hủy lịch đã được xác nhận hoặc đã thanh toán'
        );
        expect(axios.delete).not.toHaveBeenCalled();
      });
    });
  
    test('allows admin to cancel unpaid appointment', async () => {
      axios.delete.mockResolvedValueOnce({});
      render(<AppointmentList token="test-token" isAdmin={true} />);
      
      await waitFor(async () => {
        const cancelButtons = screen.getAllByText('Hủy');
        userEvent.click(cancelButtons[0]); // Lịch chưa thanh toán
        
        expect(axios.delete).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Hủy lịch thành công');
      });
    });
  
    test('prevents user from canceling past appointment', async () => {
      render(<AppointmentList token="test-token" />);
      
      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Hủy');
        userEvent.click(cancelButtons[1]); // Lịch đã qua
        
        expect(toast.error).toHaveBeenCalledWith(
          'Không thể hủy lịch đã qua thời gian'
        );
      });
    });
  });
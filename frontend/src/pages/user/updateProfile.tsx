import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/styles/pages/user/updateProfile.scss';
import { updateProfile, getCurrentUser } from '@/api/user/userAPI';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UpdateProfile: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

  // Load thông tin user khi vào trang
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setFormData({
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
          address: '', // nếu bạn có lưu address trong DB thì thêm vào đây
          password: '',
          confirmPassword: '',
        });
      } catch (err) {
        toast.error('Không thể tải thông tin tài khoản');
        navigate('/auth');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (formData.password && formData.password !== formData.confirmPassword) {
    toast.error('Mật khẩu xác nhận không khớp!');
    return;
  }

  if (formData.phone && !/^0[35789][0-9]{8}$/.test(formData.phone)) {
    toast.error('Số điện thoại không hợp lệ (VD: 0901234567)');
    return;
  }

  setLoading(true);

  try {
    const updateData: any = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
    };

    if (formData.address) updateData.address = formData.address;
    if (formData.password) updateData.password = formData.password;

    await updateProfile(updateData);

    toast.success('Cập nhật thông tin thành công! 🎉');

    // <<< LOAD LẠI THÔNG TIN MỚI NHẤT TỪ SERVER >>>
    const refreshedUser = await getCurrentUser();
    setFormData({
      name: refreshedUser.name || '',
      phone: refreshedUser.phone || '',
      email: refreshedUser.email || '',
      address: refreshedUser.address || '',
      password: '',
      confirmPassword: '',
    });

    // Cập nhật localStorage
    localStorage.setItem('user', JSON.stringify(refreshedUser));

    // Không cần navigate nữa nếu muốn ở lại trang
    // setTimeout(() => navigate('/'), 1500);

  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Cập nhật thất bại!');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="update-profile-container">
      <div className="update-profile-card">
        <h2>CẬP NHẬT THÔNG TIN TÀI KHOẢN</h2>

        <form onSubmit={handleSubmit} className="update-form">
          <div className="form-row">
            <div className="form-group">
              <label>Họ tên <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </div>

            <div className="form-group">
              <label>Điện thoại <span className="required">*</span></label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="0901234567890"
                maxLength={10}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Địa chỉ Email <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="example@gmail.com"
              />
            </div>

            <div className="form-group">
              <label>Địa chỉ giao hàng</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ví dụ: 123 Đường Láng, Hà Nội"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mật khẩu mới <span className="note">(Không cần nhập nếu giữ nguyên)</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Để trống nếu không đổi"
              />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Đang cập nhật...' : 'CẬP NHẬT'}
          </button>
        </form>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default UpdateProfile;
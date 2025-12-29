import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/styles/pages/user/updateProfile.scss';
import { updateProfile, getCurrentUser } from '@/api/user/userAPI';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLanguage } from '@/context/LanguageContext'; // ✅ IMPORT

const UpdateProfile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage(); // ✅ SỬ DỤNG HOOK

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
          address: user.address || '',
          password: '',
          confirmPassword: '',
        });
      } catch (err) {
        toast.error(t('profile.loadError'));
        navigate('/auth');
      }
    };
    fetchUser();
  }, [navigate, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }

    if (formData.phone && !/^0[35789][0-9]{8}$/.test(formData.phone)) {
      toast.error(t('profile.invalidPhone'));
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

      toast.success(t('profile.updateSuccess'));

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

    } catch (err: any) {
      toast.error(err.response?.data?.message || t('profile.updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-profile-container">
      <div className="update-profile-card">
        <h2>{t('profile.pageTitle')}</h2>

        <form onSubmit={handleSubmit} className="update-form">
          <div className="form-row">
            <div className="form-group">
              <label>
                {t('profile.fullName')} <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t('profile.fullNamePlaceholder')}
              />
            </div>

            <div className="form-group">
              <label>
                {t('profile.phone')} <span className="required">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder={t('profile.phonePlaceholder')}
                maxLength={10}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                {t('profile.email')} <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={t('profile.emailPlaceholder')}
              />
            </div>

            <div className="form-group">
              <label>{t('profile.address')}</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={t('profile.addressPlaceholder')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                {t('profile.newPassword')} <span className="note">{t('profile.passwordNote')}</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('profile.newPasswordPlaceholder')}
              />
            </div>

            <div className="form-group">
              <label>{t('profile.confirmPassword')}</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t('profile.confirmPasswordPlaceholder')}
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? t('profile.updating') : t('profile.updateButton')}
          </button>
        </form>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default UpdateProfile;
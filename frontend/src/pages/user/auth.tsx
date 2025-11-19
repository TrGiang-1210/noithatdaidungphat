import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '@/styles/pages/user/auth.scss'; // file scss mới mình vừa gửi
import { loginUser } from '@/api/user/userAPI';
import { registerUser } from '@/api/user/userAPI';
import { Eye, EyeOff } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordReg, setShowPasswordReg] = useState(false);
  const [showConfirmReg, setShowConfirmReg] = useState(false);

  // Login states
  const [emailLogin, setEmailLogin] = useState('');
  const [passLogin, setPassLogin] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  // Register states
  const [nameReg, setNameReg] = useState('');
  const [phoneReg, setPhoneReg] = useState('');
  const [emailReg, setEmailReg] = useState('');
  const [passReg, setPassReg] = useState('');
  const [confirmReg, setConfirmReg] = useState('');
  const [errorReg, setErrorReg] = useState('');

  const navigate = useNavigate();

  // ========== XỬ LÝ ĐĂNG NHẬP ==========
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin('');
    try {
      const res = await loginUser({ email: emailLogin, password: passLogin });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));

      if (res.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setErrorLogin(err.response?.data?.message || 'Đăng nhập thất bại!');
    }
  };

  // ========== XỬ LÝ ĐĂNG KÝ ==========
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorReg('');

    if (passReg !== confirmReg) {
      setErrorReg('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      await registerUser({
        name: nameReg,
        phone: phoneReg,
        email: emailReg,
        password: passReg,
      });
      setErrorReg('Đăng ký thành công! Đang chuyển về trang chủ...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setErrorReg(err.response?.data?.message || 'Đăng ký thất bại!');
    }
  };

  return (
    <div className="auth-layout">
      {/* ==================== FORM ĐĂNG KÝ - BÊN TRÁI ==================== */}
      <div className="auth-card register-side">
        <h2>Đăng ký tài khoản</h2>
        <p className="subtitle">Tạo tài khoản để mua sắm nhanh hơn!</p>

        <form onSubmit={handleRegister} className="auth-form">
          {errorReg && <p className="error-message">{errorReg}</p>}

          <input type="text" placeholder="Họ và tên" value={nameReg} onChange={(e) => setNameReg(e.target.value)} required />
          <input type="tel" placeholder="Số điện thoại" value={phoneReg} onChange={(e) => setPhoneReg(e.target.value)} required />
          <input type="email" placeholder="Email" value={emailReg} onChange={(e) => setEmailReg(e.target.value)} required />

          <div className="password-group">
            <input
              type={showPasswordReg ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={passReg}
              onChange={(e) => setPassReg(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPasswordReg(!showPasswordReg)}>
              {showPasswordReg ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="password-group">
            <input
              type={showConfirmReg ? 'text' : 'password'}
              placeholder="Xác nhận mật khẩu"
              value={confirmReg}
              onChange={(e) => setConfirmReg(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowConfirmReg(!showConfirmReg)}>
              {showConfirmReg ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="submit-btn register-btn">
            ĐĂNG KÝ
          </button>

          
        </form>
      </div>

      {/* ==================== FORM ĐĂNG NHẬP - BÊN PHẢI ==================== */}
      <div className="auth-card login-side">
        <h2>Chào mừng quay lại!</h2>
        <p className="subtitle">Đăng nhập để tiếp tục mua sắm</p>

        <form onSubmit={handleLogin} className="auth-form">
          {errorLogin && <p className="error-message">{errorLogin}</p>}

          <input type="email" placeholder="Email" value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} required />

          <div className="password-group">
            <input
              type={showPasswordLogin ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={passLogin}
              onChange={(e) => setPassLogin(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPasswordLogin(!showPasswordLogin)}>
              {showPasswordLogin ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="submit-btn login-btn">
            ĐĂNG NHẬP
          </button>

          
          <p className="footer-text forgotten">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </p>
        </form>
      </div>

    </div>
  );
};

export default AuthPage;
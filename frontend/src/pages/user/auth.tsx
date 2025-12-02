import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '@/styles/pages/user/auth.scss';
import { loginUser, registerUser } from '@/api/user/userAPI';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthContext } from '@/context/AuthContext';

const AuthPage: React.FC = () => {
  // Show/Hide password
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordReg, setShowPasswordReg] = useState(false);
  const [showConfirmReg, setShowConfirmReg] = useState(false);

  // ========= ĐĂNG NHẬP =========
  const [usernameOrPhone, setUsernameOrPhone] = useState(''); // Email hoặc SĐT
  const [passLogin, setPassLogin] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  // ========= ĐĂNG KÝ =========
  const [nameReg, setNameReg] = useState('');
  const [phoneReg, setPhoneReg] = useState('');
  const [emailReg, setEmailReg] = useState('');
  const [passReg, setPassReg] = useState('');
  const [confirmReg, setConfirmReg] = useState('');
  const [errorReg, setErrorReg] = useState('');

  const navigate = useNavigate();
  const { login: contextLogin } = useContext(AuthContext);

  // ========== XỬ LÝ ĐĂNG NHẬP (hỗ trợ email hoặc phone) ==========
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin('');

    const loginPayload = usernameOrPhone.includes('@')
      ? { email: usernameOrPhone.trim(), password: passLogin }
      : { phone: usernameOrPhone.trim(), password: passLogin };

    try {
      const res = await loginUser(loginPayload);
      console.log('[Auth] login response raw:', res);

      // normalise shapes (userAPI returns response.data in most cases)
      const data = res?.data ?? res;
      const token = data?.token ?? data?.accessToken ?? data?.payload?.token;
      const user = data?.user ?? data?.payload?.user ?? data?.data?.user;

      if (!token) {
        const msg = data?.message || 'Không lấy được token từ server';
        setErrorLogin(msg);
        toast.error(msg);
        return;
      }

      // wait for context to set user (contextLogin sets user immediately if we pass user)
      await contextLogin(token, user);
      toast.success(`Xin chào ${user?.name?.split?.(' ')[0] ?? 'khách'}!`);

      // confirm user from localStorage / context later if needed
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      console.error('[Auth] login error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Email/số điện thoại hoặc mật khẩu không đúng!';
      setErrorLogin(msg);
      toast.error(msg);
    }
  };

  // REGISTER: auto-login via context after register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorReg('');

    if (passReg !== confirmReg) {
      setErrorReg('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      const res = await registerUser({
        name: nameReg,
        phone: phoneReg,
        email: emailReg,
        password: passReg,
      });
      console.log('[Auth] register response raw:', res);

      const data = res?.data ?? res;
      const token = data?.token ?? data?.accessToken ?? data?.payload?.token;
      const user = data?.user ?? data?.payload?.user ?? data?.data?.user;

      if (!token) {
        const msg = data?.message || 'Đăng ký thành công nhưng không nhận được token';
        setErrorReg(msg);
        toast.error(msg);
        return;
      }

      await contextLogin(token, user);
      toast.success(`Chào mừng ${user?.name?.split?.(' ')[0] ?? 'bạn'}! Đăng ký thành công 🎉`);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('[Auth] register error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Đăng ký thất bại!';
      setErrorReg(msg);
      toast.error(msg);
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

          <input
            type="text"
            placeholder="Họ và tên"
            value={nameReg}
            onChange={(e) => setNameReg(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Số điện thoại"
            value={phoneReg}
            onChange={(e) => setPhoneReg(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={emailReg}
            onChange={(e) => setEmailReg(e.target.value)}
            required
          />

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

          {/* INPUT DUY NHẤT CHO EMAIL HOẶC SỐ ĐIỆN THOẠI */}
          <input
            type="text"
            placeholder="Email hoặc số điện thoại"
            value={usernameOrPhone}
            onChange={(e) => setUsernameOrPhone(e.target.value)}
            required
            autoComplete="username"
          />

          <div className="password-group">
            <input
              type={showPasswordLogin ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={passLogin}
              onChange={(e) => setPassLogin(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPasswordLogin(!showPasswordLogin)}>
              {showPasswordLogin ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="submit-btn login-btn">
            ĐĂNG NHẬP
          </button>

          <p className="footer-text forgotten">
            <Link to="/quen-mat-khau">Quên mật khẩu?</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
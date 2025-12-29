import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '@/styles/pages/user/auth.scss';
import { loginUser, registerUser } from '@/api/user/userAPI';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext'; // ✅ IMPORT

const AuthPage: React.FC = () => {
  const { t } = useLanguage(); // ✅ SỬ DỤNG HOOK

  // Show/Hide password
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordReg, setShowPasswordReg] = useState(false);
  const [showConfirmReg, setShowConfirmReg] = useState(false);

  // ========= ĐĂNG NHẬP =========
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
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

  // ========== XỬ LÝ ĐĂNG NHẬP ==========
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin('');

    const loginPayload = usernameOrPhone.includes('@')
      ? { email: usernameOrPhone.trim(), password: passLogin }
      : { phone: usernameOrPhone.trim(), password: passLogin };

    try {
      const res = await loginUser(loginPayload);
      console.log('[Auth] login response raw:', res);

      const data = res?.data ?? res;
      const token = data?.token ?? data?.accessToken ?? data?.payload?.token;
      const user = data?.user ?? data?.payload?.user ?? data?.data?.user;

      if (!token) {
        const msg = data?.message || t('auth.noTokenError');
        setErrorLogin(msg);
        toast.error(msg);
        return;
      }

      await contextLogin(token, user);
      toast.success(t('auth.welcomeBack', { name: user?.name?.split?.(' ')[0] ?? t('auth.guest') }));

      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      console.error('[Auth] login error:', err);
      const msg = err?.response?.data?.message || err?.message || t('auth.loginError');
      setErrorLogin(msg);
      toast.error(msg);
    }
  };

  // ========== XỬ LÝ ĐĂNG KÝ ==========
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorReg('');

    if (passReg !== confirmReg) {
      setErrorReg(t('auth.passwordMismatch'));
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
        const msg = data?.message || t('auth.registerNoToken');
        setErrorReg(msg);
        toast.error(msg);
        return;
      }

      await contextLogin(token, user);
      toast.success(t('auth.registerSuccess', { name: user?.name?.split?.(' ')[0] ?? t('auth.you') }));
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('[Auth] register error:', err);
      const msg = err?.response?.data?.message || err?.message || t('auth.registerError');
      setErrorReg(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="auth-layout">
      {/* ==================== FORM ĐĂNG KÝ - BÊN TRÁI ==================== */}
      <div className="auth-card register-side">
        <h2>{t('auth.registerTitle')}</h2>
        <p className="subtitle">{t('auth.registerSubtitle')}</p>

        <form onSubmit={handleRegister} className="auth-form">
          {errorReg && <p className="error-message">{errorReg}</p>}

          <input
            type="text"
            placeholder={t('auth.fullNamePlaceholder')}
            value={nameReg}
            onChange={(e) => setNameReg(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder={t('auth.phonePlaceholder')}
            value={phoneReg}
            onChange={(e) => setPhoneReg(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={emailReg}
            onChange={(e) => setEmailReg(e.target.value)}
            required
          />

          <div className="password-group">
            <input
              type={showPasswordReg ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
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
              placeholder={t('auth.confirmPasswordPlaceholder')}
              value={confirmReg}
              onChange={(e) => setConfirmReg(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowConfirmReg(!showConfirmReg)}>
              {showConfirmReg ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="submit-btn register-btn">
            {t('auth.registerButton')}
          </button>
        </form>
      </div>

      {/* ==================== FORM ĐĂNG NHẬP - BÊN PHẢI ==================== */}
      <div className="auth-card login-side">
        <h2>{t('auth.loginTitle')}</h2>
        <p className="subtitle">{t('auth.loginSubtitle')}</p>

        <form onSubmit={handleLogin} className="auth-form">
          {errorLogin && <p className="error-message">{errorLogin}</p>}

          <input
            type="text"
            placeholder={t('auth.emailOrPhonePlaceholder')}
            value={usernameOrPhone}
            onChange={(e) => setUsernameOrPhone(e.target.value)}
            required
            autoComplete="username"
          />

          <div className="password-group">
            <input
              type={showPasswordLogin ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
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
            {t('auth.loginButton')}
          </button>

          <p className="footer-text forgotten">
            <Link to="/quen-mat-khau">{t('auth.forgotPassword')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
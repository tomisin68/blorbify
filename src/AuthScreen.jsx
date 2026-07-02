import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import OnboardingScreen from './OnboardingScreen';

/* ============================================================
   AUTHENTICATION SCREEN — Blorbify
   Design tokens (same as Blorbify)
   Ink     #192328  (base dark)
   Ink+    #0F1518  (deep panels)
   Signal  #AFFF00  (acid lime accent)
   Paper   #F6F8F1  (light section bg)
   Slate   #93A2A6 / #5C6B6E (muted text)
   Type    Raleway (display + body), JetBrains Mono (data/eyebrows)
   Icons   hand-built, linear/duotone style modeled on Iconsax
   ============================================================ */

/* ---------------- Icon set (same as Blorbify) ---------------- */
const IconBase = ({ children, size = 24, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    {children}
  </svg>
);

const IconEnvelope = (p) => (
  <IconBase {...p}>
    <path d="M3 7.5L10.5 13.5L18 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
  </IconBase>
);

const IconLock = (p) => (
  <IconBase {...p}>
    <rect x="6.5" y="10.5" width="11" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8.5 10.5V7.5C8.5 5.5 9.8 4 12 4C14.2 4 15.5 5.5 15.5 7.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="15" r="1.5" fill="currentColor" />
  </IconBase>
);

const IconEye = (p) => (
  <IconBase {...p}>
    <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
  </IconBase>
);

const IconEyeSlash = (p) => (
  <IconBase {...p}>
    <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </IconBase>
);

const IconUser = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3.5 22.5C3.5 18.5 7.5 15 12 15C16.5 15 20.5 18.5 20.5 22.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </IconBase>
);

const IconClose = (p) => (
  <IconBase {...p}>
    <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </IconBase>
);

const IconCheck = (p) => (
  <IconBase {...p}>
    <path d="M5 13L9 17L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

const IconArrow = (p) => (
  <IconBase {...p}>
    <path d="M4.5 12H19.5M13.5 6L19.5 12L13.5 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

/* ---------------- Toast / Snackbar System ---------------- */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast--${type}`}>
      <span className="toast-icon">
        {type === 'success' && <IconCheck size={20} />}
        {type === 'error' && <IconClose size={20} />}
        {type === 'info' && <IconEnvelope size={20} />}
      </span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        <IconClose size={16} />
      </button>
    </div>
  );
};

/* ---------------- Main Auth Component ---------------- */
export default function AuthScreen({ initialMode = 'login', onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userId, setUserId] = useState(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      if (!email || !password) {
        addToast('Please enter your email and password to continue.', 'error');
        return;
      }
    } else {
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        addToast('Please fill in all fields to create your account.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        addToast('Passwords do not match. Please try again.', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        await setDoc(
          doc(db, 'users', user.uid),
          {
            email: user.email,
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        addToast('Welcome back! You have been signed in.', 'success');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: user.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          provider: 'email',
        });
        setUserId(user.uid);
        setShowOnboarding(true);
        addToast('Account created! Welcome to Blorbify.', 'success');
        return;
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      const message = error?.message || 'Authentication failed. Please try again.';
      addToast(message.replace('Firebase: ', ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowPassword(false);
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setConfirmPassword('');
  };

  if (showOnboarding && userId) {
    return (
      <OnboardingScreen
        userId={userId}
        onComplete={() => {
          setShowOnboarding(false);
          onSuccess?.();
          onClose?.();
        }}
        onSkip={() => {
          setShowOnboarding(false);
          onSuccess?.();
          onClose?.();
        }}
      />
    );
  }

  return (
    <div className="auth-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,500&family=JetBrains+Mono:wght@400;500;700&display=swap');

        :root {
          --ink: #192328;
          --ink-deep: #0F1518;
          --ink-soft: #233038;
          --signal: #AFFF00;
          --signal-dim: #8FDD00;
          --paper: #F6F8F1;
          --paper-dim: #EAEFE0;
          --slate: #93A2A6;
          --slate-dark: #5C6B6E;
          --line: rgba(255,255,255,0.09);
          --line-dark: rgba(25,35,40,0.1);
          --radius: 18px;
          --shadow: 0 30px 60px rgba(0,0,0,0.3);
        }

        .auth-root {
          font-family: 'Raleway', sans-serif;
          min-height: 100vh;
          background: radial-gradient(120% 100% at 15% 0%, #223038 0%, var(--ink) 55%, var(--ink-deep) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          margin: 0;
          -webkit-font-smoothing: antialiased;
          position: relative;
        }

        .auth-root * {
          box-sizing: border-box;
        }

        /* -------- Toast / Snackbar -------- */
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 420px;
          width: 100%;
          pointer-events: none;
        }

        .toast {
          pointer-events: all;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          border-radius: 14px;
          background: var(--ink-deep);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          color: var(--paper);
          animation: toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(12px);
          background: rgba(15, 21, 24, 0.92);
        }

        .toast--success {
          border-left: 3px solid var(--signal);
        }
        .toast--success .toast-icon {
          color: var(--signal);
        }

        .toast--error {
          border-left: 3px solid #FF6B6B;
        }
        .toast--error .toast-icon {
          color: #FF6B6B;
        }

        .toast--info {
          border-left: 3px solid var(--slate);
        }
        .toast--info .toast-icon {
          color: var(--slate);
        }

        .toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .toast-message {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.5;
          flex: 1;
        }

        .toast-close {
          background: none;
          border: none;
          color: var(--slate);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .toast-close:hover {
          color: var(--paper);
        }

        @keyframes toastIn {
          0% {
            opacity: 0;
            transform: translateX(40px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        /* -------- Auth Card -------- */
        .auth-card {
          width: 100%;
          max-width: 460px;
          background: var(--ink-deep);
          border: 1px solid var(--line);
          border-radius: 24px;
          padding: 44px 40px 40px;
          box-shadow: var(--shadow);
          position: relative;
          overflow: hidden;
        }

        .auth-card::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(175,255,0,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .auth-card::after {
          content: '';
          position: absolute;
          bottom: -100px;
          left: -100px;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(175,255,0,0.04) 0%, transparent 70%);
          pointer-events: none;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 34px;
          position: relative;
          z-index: 1;
        }

        .auth-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 24px;
          color: var(--paper);
          letter-spacing: -0.02em;
          margin-bottom: 8px;
          text-decoration: none;
        }

        .auth-logo-dot {
          width: 12px;
          height: 12px;
          border-radius: 4px;
          background: var(--signal);
          box-shadow: 0 0 20px rgba(175,255,0,0.5);
        }

        .auth-title {
          color: var(--paper);
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-top: 18px;
          line-height: 1.2;
        }

        .auth-title em {
          font-style: normal;
          color: var(--signal);
        }

        .auth-sub {
          color: var(--slate);
          font-size: 15px;
          margin-top: 8px;
          font-weight: 400;
        }

        /* -------- Form -------- */
        .auth-form {
          position: relative;
          z-index: 1;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-label {
          display: block;
          color: var(--slate);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--ink-soft);
          border-radius: 12px;
          border: 1px solid var(--line);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .input-wrap:focus-within {
          border-color: var(--signal);
          box-shadow: 0 0 0 4px rgba(175, 255, 0, 0.1);
        }

        .input-icon {
          color: var(--slate);
          padding: 0 0 0 16px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .input-wrap input {
          width: 100%;
          background: transparent;
          border: none;
          padding: 16px 16px 16px 12px;
          color: var(--paper);
          font-size: 15px;
          font-family: 'Raleway', sans-serif;
          font-weight: 500;
          outline: none;
        }

        .input-wrap input::placeholder {
          color: var(--slate-dark);
          font-weight: 400;
        }

        .input-wrap input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px var(--ink-soft) inset !important;
          -webkit-text-fill-color: var(--paper) !important;
        }

        .input-toggle {
          background: none;
          border: none;
          color: var(--slate);
          cursor: pointer;
          padding: 0 16px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .input-toggle:hover {
          color: var(--paper);
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 6px 0 22px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .form-options label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--slate);
          font-size: 13px;
          cursor: pointer;
        }

        .form-options label input[type="checkbox"] {
          appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid var(--slate-dark);
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .form-options label input[type="checkbox"]:checked {
          background: var(--signal);
          border-color: var(--signal);
        }

        .form-options label input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: var(--ink);
          font-size: 12px;
          font-weight: 700;
        }

        .form-options a {
          color: var(--signal);
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .form-options a:hover {
          opacity: 0.7;
        }

        .btn-auth {
          width: 100%;
          padding: 18px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 16px;
          font-family: 'Raleway', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border: none;
          background: var(--signal);
          color: var(--ink);
          position: relative;
        }

        .btn-auth:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px rgba(175, 255, 0, 0.25);
        }

        .btn-auth:active:not(:disabled) {
          transform: scale(0.98);
        }

        .btn-auth:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-auth .spinner {
          width: 22px;
          height: 22px;
          border: 2px solid var(--ink);
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .auth-footer {
          text-align: center;
          margin-top: 24px;
          color: var(--slate);
          font-size: 14px;
          position: relative;
          z-index: 1;
        }

        .auth-footer button {
          background: none;
          border: none;
          color: var(--signal);
          font-weight: 700;
          font-size: 14px;
          font-family: 'Raleway', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s;
          padding: 0 4px;
        }

        .auth-footer button:hover {
          opacity: 0.7;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 22px 0;
          color: var(--slate-dark);
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.06em;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--line);
        }

        .social-btns {
          display: flex;
          gap: 12px;
        }

        .social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px;
          border-radius: 12px;
          background: var(--ink-soft);
          border: 1px solid var(--line);
          color: var(--slate);
          font-size: 13px;
          font-weight: 600;
          font-family: 'Raleway', sans-serif;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .social-btn:hover {
          border-color: var(--slate);
          color: var(--paper);
          background: var(--ink);
        }

        .social-btn .social-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* -------- Responsive -------- */
        @media (max-width: 520px) {
          .auth-root {
            padding: 16px;
          }

          .auth-card {
            padding: 32px 22px 28px;
            border-radius: 20px;
          }

          .auth-title {
            font-size: 22px;
          }

          .auth-logo {
            font-size: 20px;
          }

          .input-wrap input {
            padding: 14px 14px 14px 10px;
            font-size: 14px;
          }

          .input-icon {
            padding: 0 0 0 12px;
          }

          .input-toggle {
            padding: 0 12px 0 0;
          }

          .btn-auth {
            padding: 16px;
            font-size: 15px;
          }

          .form-options {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .social-btns {
            flex-direction: column;
          }

          .toast-container {
            top: 12px;
            right: 12px;
            left: 12px;
            max-width: none;
          }

          .toast {
            padding: 14px 16px;
            font-size: 13px;
          }
        }

        @media (max-width: 380px) {
          .auth-card {
            padding: 24px 16px 20px;
          }

          .auth-title {
            font-size: 19px;
          }

          .auth-sub {
            font-size: 13px;
          }
        }

        @media (min-height: 800px) {
          .auth-root {
            padding: 40px;
          }
        }
      `}</style>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Auth Card */}
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-dot" />
            Blorbify
          </div>
          <h1 className="auth-title">
            {isLogin ? 'Welcome back' : 'Create your <em>store</em>'}
          </h1>
          <p className="auth-sub">
            {isLogin
              ? 'Sign in to manage your store and grow your business.'
              : 'Start selling online in minutes — no tech skills needed.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <div className="input-wrap">
                  <span className="input-icon"><IconUser size={18} /></span>
                  <input
                    type="text"
                    placeholder="Chioma"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <div className="input-wrap">
                  <span className="input-icon"><IconUser size={18} /></span>
                  <input
                    type="text"
                    placeholder="Adewale"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrap">
              <span className="input-icon"><IconEnvelope size={18} /></span>
              <input
                type="email"
                placeholder="hello@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <span className="input-icon"><IconLock size={18} /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IconEyeSlash size={18} /> : <IconEye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-wrap">
                <span className="input-icon"><IconLock size={18} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {isLogin && (
            <div className="form-options">
              <label>
                <input type="checkbox" defaultChecked />
                Remember me
              </label>
              <a href="#">Forgot password?</a>
            </div>
          )}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {isLogin ? 'Sign in' : 'Create your store'}
                <IconArrow size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">OR CONTINUE WITH</div>

        <div className="social-btns">
          <button className="social-btn" onClick={() => addToast('Google sign-in coming soon!', 'info')}>
            <span className="social-icon">
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.2 1.2 8.2 3.1l6.1-6.1C34.6 3.2 29.8 1 24 1 14.8 1 7 6.6 3.4 14.4l7.1 5.5C12.4 14.2 17.6 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.6 24.6c0-1.5-.1-3-.4-4.5H24v8.5h12.8c-.6 3-2.2 5.6-4.7 7.3l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.8z" />
                <path fill="#FBBC05" d="M10.5 28.5c-1.1-2.9-1.1-6.1 0-9L3.4 14C1.2 18.4 0 23.4 0 28.5s1.2 10.1 3.4 14.5l7.1-5.5z" />
                <path fill="#34A853" d="M24 47c6.8 0 12.5-2.2 16.7-6.1l-7.1-5.5c-2.2 1.5-5 2.4-9.6 2.4-6.4 0-11.6-4.7-13.5-11.1l-7.1 5.5C7 41.4 14.8 47 24 47z" />
              </svg>
            </span>
            Google
          </button>
          <button className="social-btn" onClick={() => addToast('Apple sign-in coming soon!', 'info')}>
            <span className="social-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.7 12.9c-.1-3.5 2.8-5.2 2.9-5.3-1.6-2.3-4.1-2.6-5-2.7-2.1-.2-4.1 1.2-5.2 1.2s-2.7-1.2-4.5-1.2C5 5 2.6 7.2 2.6 10.5c0 2.9 2.4 7.2 4.6 7.2 1.7 0 2.2-1 4.2-1s2.6 1 4.4 1c1.9 0 3.7-2.5 3.7-3.9zM15.7 4.7c1.3-1.6 1.2-2.9 1.2-3.3-1.1.1-2.5.7-3.3 1.6-.8.9-1.3 2.1-1.2 3.3 1.2.1 2.5-.6 3.3-1.6z" />
              </svg>
            </span>
            Apple
          </button>
        </div>

        <div className="auth-footer">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={toggleMode}>
            {isLogin ? 'Start your free store' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
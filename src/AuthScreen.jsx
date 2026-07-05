import { useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { sendEmailOtp, verifyEmailOtp } from './backendApi';

/* ============================================================
   AUTHENTICATION SCREEN — Blorbify
   ============================================================ */

const IconBase = ({ children, size = 24, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
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
    <path d="M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

const IconArrowLeft = (p) => (
  <IconBase {...p}>
    <path d="M19 12H5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="m11 18-6-6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

const IconAlert = (p) => (
  <IconBase {...p}>
    <path d="M12 3.5 21 19.5H3L12 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M12 9.5v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="17" r=".9" fill="currentColor" />
  </IconBase>
);

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
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <IconClose size={16} />
      </button>
    </div>
  );
};

const featureRows = [
  'A pro website + store in minutes — no code, no designer',
  'Delivery that just works, with tracking for your customers',
  'Targeted ads that bring real buyers, not just views',
];

const testimonial = {
  quote: "I went from a scattered WhatsApp catalogue to a real online store in one afternoon. My first week, I made more sales than my whole previous month.",
  name: 'Business Owner',
  meta: 'Fashion · Osogbo',
};

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const capped = Math.min(score, 4);
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score: capped, label: labels[capped] };
}

function validateEmail(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email address';
  return '';
}

export default function AuthScreen({ initialMode = 'login', verifyEmail = '', onSuccess, onCancel }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showReset, setShowReset] = useState(false);
  const [otpStep, setOtpStep] = useState(initialMode === 'verify');
  const [otpEmail, setOtpEmail] = useState(verifyEmail);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');
  const otpSentOnceRef = useRef(false);
  const otpInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justSucceeded, setJustSucceeded] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const firstFieldRef = useRef(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [isLogin, showReset]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    if (otpCooldown <= 0) return undefined;
    const timer = setTimeout(() => setOtpCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const requestOtp = async () => {
    if (otpSending || !auth.currentUser) return;
    setOtpSending(true);
    setOtpError('');
    try {
      const idToken = await auth.currentUser.getIdToken();
      const result = await sendEmailOtp(idToken);
      setOtpCooldown(result?.resendCooldownSeconds || 45);
      addToast(`We sent a 6-digit code to ${otpEmail}`, 'info');
      otpInputRef.current?.focus();
    } catch (error) {
      addToast(error.message || 'Could not send a verification code. Please try again.', 'error');
    } finally {
      setOtpSending(false);
    }
  };

  useEffect(() => {
    if (otpStep && !otpSentOnceRef.current) {
      otpSentOnceRef.current = true;
      requestOtp();
    }
    if (!otpStep) {
      otpSentOnceRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpStep]);

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    const trimmed = otpCode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setOtpError('Enter the 6-digit code from your email.');
      return;
    }

    setOtpVerifying(true);
    setOtpError('');
    try {
      const idToken = await auth.currentUser.getIdToken();
      await verifyEmailOtp(trimmed, idToken);
      setJustSucceeded(true);
      addToast('Email verified! Welcome to Blorbify.', 'success');
      setTimeout(async () => {
        await onSuccess?.(auth.currentUser);
      }, 550);
    } catch (error) {
      setOtpError(error.message || 'Incorrect code. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const setFieldError = (field, message) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const revalidateIfAttempted = (field, value, nextValues) => {
    if (!submitAttempted) return;
    const values = { email, password, confirmPassword, firstName, lastName, ...nextValues };
    if (field === 'email') setFieldError('email', validateEmail(value));
    if (field === 'firstName') setFieldError('firstName', value.trim() ? '' : 'First name is required');
    if (field === 'lastName') setFieldError('lastName', value.trim() ? '' : 'Last name is required');
    if (field === 'password') {
      setFieldError('password', value.length >= 6 ? '' : 'Use at least 6 characters');
      if (!isLogin && values.confirmPassword) {
        setFieldError('confirmPassword', values.confirmPassword === value ? '' : 'Passwords do not match');
      }
    }
    if (field === 'confirmPassword') {
      setFieldError('confirmPassword', value === values.password ? '' : 'Passwords do not match');
    }
  };

  const handleEmailChange = (value) => { setEmail(value); revalidateIfAttempted('email', value); };
  const handlePasswordChange = (value) => { setPassword(value); revalidateIfAttempted('password', value); };
  const handleConfirmPasswordChange = (value) => { setConfirmPassword(value); revalidateIfAttempted('confirmPassword', value); };
  const handleFirstNameChange = (value) => { setFirstName(value); revalidateIfAttempted('firstName', value); };
  const handleLastNameChange = (value) => { setLastName(value); revalidateIfAttempted('lastName', value); };

  const passwordStrength = !isLogin ? getPasswordStrength(password) : null;
  const confirmMatches = !isLogin && confirmPassword.length > 0 ? confirmPassword === password : null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);

    const errors = {
      email: validateEmail(email),
      password: password.length >= 6 ? '' : 'Use at least 6 characters',
    };
    if (!isLogin) {
      errors.firstName = firstName.trim() ? '' : 'First name is required';
      errors.lastName = lastName.trim() ? '' : 'Last name is required';
      errors.confirmPassword = confirmPassword === password ? '' : 'Passwords do not match';
    }

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

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

        addToast('Welcome back! Your account is ready.', 'success');
        setJustSucceeded(true);
        setTimeout(async () => {
          await onSuccess?.(auth.currentUser);
        }, 550);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: user.email,
          onboardingCompleted: false,
          emailVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          provider: 'email',
        });

        setOtpEmail(user.email);
        setOtpStep(true);
        setLoading(false);
      }
    } catch (error) {
      const message = error?.message || 'Authentication failed. Please try again.';
      addToast(message.replace('Firebase: ', ''), 'error');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowPassword(false);
    setSubmitAttempted(false);
    setFieldErrors({});
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setConfirmPassword('');
  };

  const openReset = () => {
    setResetEmail(email);
    setResetSent(false);
    setShowReset(true);
  };

  const closeReset = () => {
    setShowReset(false);
    setResetSent(false);
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    const trimmed = resetEmail.trim();
    const emailError = validateEmail(trimmed);
    if (emailError) {
      addToast(emailError, 'error');
      return;
    }

    setResetSending(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setResetSent(true);
    } catch (error) {
      const message = error?.message || 'Could not send reset email. Please try again.';
      addToast(message.replace('Firebase: ', ''), 'error');
    } finally {
      setResetSending(false);
    }
  };

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
          --danger: #FF6B6B;
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

        .auth-root * { box-sizing: border-box; }

        @media (prefers-reduced-motion: reduce) {
          .auth-root *, .auth-root *::before, .auth-root *::after {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }

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
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          color: var(--paper);
          animation: toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(12px);
          background: rgba(15, 21, 24, 0.92);
        }

        .toast--success { border-left: 3px solid var(--signal); }
        .toast--success .toast-icon { color: var(--signal); }
        .toast--error { border-left: 3px solid var(--danger); }
        .toast--error .toast-icon { color: var(--danger); }
        .toast--info { border-left: 3px solid var(--slate); }
        .toast--info .toast-icon { color: var(--slate); }

        .toast-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .toast-message { font-size: 14px; font-weight: 500; line-height: 1.5; flex: 1; }
        .toast-close { background: none; border: none; color: var(--slate); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; transition: color 0.2s; flex-shrink: 0; }
        .toast-close:hover { color: var(--paper); }

        @keyframes toastIn {
          0% { opacity: 0; transform: translateX(40px) scale(0.96); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }

        /* -------- Shell: two-column on desktop -------- */
        .auth-shell {
          width: 100%;
          max-width: 1000px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: var(--shadow);
          background: var(--ink-deep);
          border: 1px solid var(--line);
        }

        /* -------- Brand / trust panel -------- */
        .auth-brand {
          position: relative;
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(140% 120% at 0% 0%, rgba(175,255,0,0.16) 0%, transparent 55%),
            radial-gradient(120% 100% at 100% 100%, rgba(175,255,0,0.08) 0%, transparent 60%),
            linear-gradient(165deg, #16211f 0%, var(--ink) 55%, var(--ink-deep) 100%);
          overflow: hidden;
        }

        .auth-brand::before {
          content: '';
          position: absolute;
          top: -80px;
          right: -80px;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(175,255,0,0.14) 0%, transparent 70%);
          animation: floatGlow 9s ease-in-out infinite;
        }

        @keyframes floatGlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-16px, 18px) scale(1.08); }
        }

        .auth-brand-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 22px;
          color: var(--paper);
          letter-spacing: -0.02em;
          position: relative;
          z-index: 1;
        }

        .auth-brand-headline {
          position: relative;
          z-index: 1;
          color: var(--paper);
          font-size: clamp(26px, 3vw, 32px);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin: 40px 0 28px;
        }

        .auth-brand-headline em {
          font-style: normal;
          color: var(--signal);
        }

        .auth-features {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 16px;
          margin-bottom: auto;
        }

        .auth-feature-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: var(--paper-dim);
          font-size: 14px;
          line-height: 1.5;
        }

        .auth-feature-check {
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(175,255,0,0.14);
          color: var(--signal);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }

        .auth-testimonial {
          position: relative;
          z-index: 1;
          margin-top: 36px;
          padding: 20px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--line);
        }

        .auth-testimonial p {
          color: var(--paper);
          font-size: 13.5px;
          line-height: 1.65;
          margin: 0 0 12px;
          font-style: italic;
        }

        .auth-testimonial-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .auth-testimonial-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--signal);
          color: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          flex-shrink: 0;
        }

        .auth-testimonial-name { color: var(--paper); font-size: 12.5px; font-weight: 700; }
        .auth-testimonial-sub { color: var(--slate); font-size: 11.5px; }

        /* -------- Form panel -------- */
        .auth-form-panel {
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
        }

        .auth-header { margin-bottom: 30px; }

        .auth-title {
          color: var(--paper);
          font-size: 27px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin: 0;
        }

        .auth-title em { font-style: normal; color: var(--signal); }

        .auth-sub {
          color: var(--slate);
          font-size: 14.5px;
          margin-top: 8px;
          font-weight: 400;
          line-height: 1.5;
        }

        .auth-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--slate);
          background: none;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          margin-bottom: 18px;
          transition: color 0.2s;
        }
        .auth-back-link:hover { color: var(--paper); }

        /* -------- Mode transition -------- */
        .auth-form-fade {
          animation: formIn 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes formIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .auth-form { position: relative; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .form-group { margin-bottom: 16px; }

        .form-label {
          display: block;
          color: var(--slate);
          font-size: 12.5px;
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

        .input-wrap.has-error {
          border-color: var(--danger);
          animation: shake 0.32s ease;
        }
        .input-wrap.has-error:focus-within {
          box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12);
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .field-error {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--danger);
          font-size: 12px;
          font-weight: 600;
          margin-top: 6px;
        }

        .field-match {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 6px;
        }
        .field-match.ok { color: var(--signal); }
        .field-match.no { color: var(--danger); }

        .input-icon { color: var(--slate); padding: 0 0 0 16px; display: flex; align-items: center; flex-shrink: 0; }

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

        .input-wrap input::placeholder { color: var(--slate-dark); font-weight: 400; }

        .otp-input {
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 20px !important;
          letter-spacing: 10px;
          text-align: center;
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
        .input-toggle:hover { color: var(--paper); }

        .password-strength {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .password-strength-track {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
        }

        .password-strength-seg {
          height: 4px;
          border-radius: 999px;
          background: var(--line-dark);
          background: rgba(255,255,255,0.08);
          transition: background 0.2s ease;
        }
        .password-strength-seg.filled.tier-1 { background: var(--danger); }
        .password-strength-seg.filled.tier-2 { background: #FFB020; }
        .password-strength-seg.filled.tier-3 { background: #8FDD00; }
        .password-strength-seg.filled.tier-4 { background: var(--signal); }

        .password-strength-label {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--slate);
          white-space: nowrap;
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

        .form-options button.link {
          background: none;
          border: none;
          color: var(--signal);
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.2s;
          font-family: 'Raleway', sans-serif;
        }
        .form-options button.link:hover { opacity: 0.7; }

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

        .btn-auth:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(175, 255, 0, 0.25); }
        .btn-auth:active:not(:disabled) { transform: scale(0.98); }
        .btn-auth:disabled { opacity: 0.75; cursor: not-allowed; }
        .btn-auth.succeeded { background: var(--signal); }

        .btn-auth .spinner {
          width: 22px;
          height: 22px;
          border: 2px solid var(--ink);
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

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
        .auth-footer button:hover { opacity: 0.7; }

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

        .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--line); }

        .social-btns { display: flex; gap: 12px; }

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

        .social-btn:hover { border-color: var(--slate); color: var(--paper); background: var(--ink); }
        .social-btn .social-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }

        /* -------- Reset password mini flow -------- */
        .reset-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
          padding: 12px 0 4px;
        }
        .reset-success-badge {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(175,255,0,0.14);
          color: var(--signal);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reset-success p { color: var(--slate); font-size: 14px; line-height: 1.6; margin: 0; }
        .reset-success strong { color: var(--paper); }

        /* -------- Responsive -------- */
        @media (max-width: 900px) {
          .auth-shell { grid-template-columns: 1fr; max-width: 460px; }
          .auth-brand { display: none; }
          .auth-form-panel { padding: 44px 40px 40px; }
        }

        @media (max-width: 520px) {
          .auth-root { padding: 16px; }
          .auth-form-panel { padding: 32px 22px 28px; }
          .auth-shell { border-radius: 20px; }
          .auth-title { font-size: 22px; }
          .form-row { grid-template-columns: 1fr; gap: 0; }
          .input-wrap input { padding: 14px 14px 14px 10px; font-size: 14px; }
          .input-icon { padding: 0 0 0 12px; }
          .input-toggle { padding: 0 12px 0 0; }
          .btn-auth { padding: 16px; font-size: 15px; }
          .form-options { flex-direction: column; align-items: flex-start; gap: 10px; }
          .social-btns { flex-direction: column; }
          .toast-container { top: 12px; right: 12px; left: 12px; max-width: none; }
          .toast { padding: 14px 16px; font-size: 13px; }
        }

        @media (max-width: 380px) {
          .auth-form-panel { padding: 24px 16px 20px; }
          .auth-title { font-size: 19px; }
          .auth-sub { font-size: 13px; }
        }

        @media (min-height: 800px) {
          .auth-root { padding: 40px; }
        }
      `}</style>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      <div className="auth-shell">
        {/* Brand / trust panel */}
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--signal)', boxShadow: '0 0 20px rgba(175,255,0,0.5)' }} />
            Blorbify
          </div>
          <h2 className="auth-brand-headline">
            Your business deserves to look this <em>good</em> online.
          </h2>
          <div className="auth-features">
            {featureRows.map((feature) => (
              <div className="auth-feature-row" key={feature}>
                <span className="auth-feature-check"><IconCheck size={13} /></span>
                {feature}
              </div>
            ))}
          </div>
          <div className="auth-testimonial">
            <p>&ldquo;{testimonial.quote}&rdquo;</p>
            <div className="auth-testimonial-meta">
              <span className="auth-testimonial-avatar">{testimonial.name.charAt(0)}</span>
              <div>
                <div className="auth-testimonial-name">{testimonial.name}</div>
                <div className="auth-testimonial-sub">{testimonial.meta}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="auth-form-panel">
          {showReset ? (
            <div className="auth-form-fade" key="reset">
              <button type="button" className="auth-back-link" onClick={closeReset}>
                <IconArrowLeft size={15} /> Back to sign in
              </button>
              <div className="auth-header">
                <h1 className="auth-title">Reset your password</h1>
                <p className="auth-sub">Enter your email and we&rsquo;ll send you a link to set a new one.</p>
              </div>

              {resetSent ? (
                <div className="reset-success">
                  <span className="reset-success-badge"><IconCheck size={26} /></span>
                  <p>Check <strong>{resetEmail.trim()}</strong> for a link to reset your password. It should arrive within a couple of minutes.</p>
                  <button type="button" className="btn-auth" style={{ marginTop: 8 }} onClick={closeReset}>
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form className="auth-form" onSubmit={handleResetSubmit}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-wrap">
                      <span className="input-icon"><IconEnvelope size={18} /></span>
                      <input
                        ref={firstFieldRef}
                        type="email"
                        placeholder="hello@yourbusiness.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-auth" disabled={resetSending}>
                    {resetSending ? (<><span className="spinner" /> Sending link...</>) : 'Send reset link'}
                  </button>
                </form>
              )}
            </div>
          ) : otpStep ? (
            <div className="auth-form-fade" key="verify">
              <button
                type="button"
                className="auth-back-link"
                onClick={() => {
                  if (initialMode === 'verify') {
                    onCancel?.();
                  } else {
                    setOtpStep(false);
                    setOtpCode('');
                    setOtpError('');
                  }
                }}
              >
                <IconArrowLeft size={15} /> {initialMode === 'verify' ? 'Sign out' : 'Back'}
              </button>
              <div className="auth-header">
                <h1 className="auth-title">Verify your <em>email</em></h1>
                <p className="auth-sub">
                  Enter the 6-digit code we sent to <strong style={{ color: 'var(--paper)' }}>{otpEmail}</strong>.
                </p>
              </div>

              <form className="auth-form" onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label className="form-label">Verification Code</label>
                  <div className={`input-wrap ${otpError ? 'has-error' : ''}`}>
                    <span className="input-icon"><IconLock size={18} /></span>
                    <input
                      ref={otpInputRef}
                      className="otp-input"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setOtpError('');
                      }}
                    />
                  </div>
                  {otpError && <div className="field-error"><IconAlert size={13} /> {otpError}</div>}
                </div>

                <button
                  type="submit"
                  className={`btn-auth ${justSucceeded ? 'succeeded' : ''}`}
                  disabled={otpVerifying || otpCode.length !== 6}
                >
                  {justSucceeded ? (
                    <><IconCheck size={20} /> Verified!</>
                  ) : otpVerifying ? (
                    <><span className="spinner" /> Verifying...</>
                  ) : (
                    <>Verify email<IconArrow size={18} /></>
                  )}
                </button>
              </form>

              <div className="auth-footer">
                Didn&rsquo;t get the code?{' '}
                <button type="button" onClick={requestOtp} disabled={otpSending || otpCooldown > 0}>
                  {otpSending ? 'Sending...' : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-form-fade" key={isLogin ? 'login' : 'signup'}>
              <div className="auth-header">
                <h1 className="auth-title">
                  {isLogin ? 'Welcome back' : <>Create your <em>store</em></>}
                </h1>
                <p className="auth-sub">
                  {isLogin
                    ? 'Sign in to manage your store and grow your business.'
                    : 'Start selling online in minutes — no tech skills needed.'}
                </p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {!isLogin && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <div className={`input-wrap ${fieldErrors.firstName ? 'has-error' : ''}`}>
                        <span className="input-icon"><IconUser size={18} /></span>
                        <input
                          ref={firstFieldRef}
                          type="text"
                          placeholder="Chioma"
                          value={firstName}
                          onChange={(e) => handleFirstNameChange(e.target.value)}
                        />
                      </div>
                      {fieldErrors.firstName && <div className="field-error"><IconAlert size={13} /> {fieldErrors.firstName}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <div className={`input-wrap ${fieldErrors.lastName ? 'has-error' : ''}`}>
                        <span className="input-icon"><IconUser size={18} /></span>
                        <input
                          type="text"
                          placeholder="Adewale"
                          value={lastName}
                          onChange={(e) => handleLastNameChange(e.target.value)}
                        />
                      </div>
                      {fieldErrors.lastName && <div className="field-error"><IconAlert size={13} /> {fieldErrors.lastName}</div>}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className={`input-wrap ${fieldErrors.email ? 'has-error' : ''}`}>
                    <span className="input-icon"><IconEnvelope size={18} /></span>
                    <input
                      ref={isLogin ? firstFieldRef : undefined}
                      type="email"
                      placeholder="hello@yourbusiness.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                    />
                  </div>
                  {fieldErrors.email && <div className="field-error"><IconAlert size={13} /> {fieldErrors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className={`input-wrap ${fieldErrors.password ? 'has-error' : ''}`}>
                    <span className="input-icon"><IconLock size={18} /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
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
                  {fieldErrors.password && <div className="field-error"><IconAlert size={13} /> {fieldErrors.password}</div>}
                  {!isLogin && password.length > 0 && (
                    <div className="password-strength">
                      <div className="password-strength-track">
                        {[1, 2, 3, 4].map((tier) => (
                          <div key={tier} className={`password-strength-seg ${passwordStrength.score >= tier ? `filled tier-${tier}` : ''}`} />
                        ))}
                      </div>
                      <span className="password-strength-label">{passwordStrength.label}</span>
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div className={`input-wrap ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
                      <span className="input-icon"><IconLock size={18} /></span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      />
                    </div>
                    {fieldErrors.confirmPassword ? (
                      <div className="field-error"><IconAlert size={13} /> {fieldErrors.confirmPassword}</div>
                    ) : confirmMatches !== null && (
                      <div className={`field-match ${confirmMatches ? 'ok' : 'no'}`}>
                        {confirmMatches ? <IconCheck size={13} /> : <IconClose size={13} />} {confirmMatches ? 'Passwords match' : 'Passwords do not match yet'}
                      </div>
                    )}
                  </div>
                )}

                {isLogin && (
                  <div className="form-options">
                    <label>
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                      Remember me
                    </label>
                    <button type="button" className="link" onClick={openReset}>Forgot password?</button>
                  </div>
                )}

                <button type="submit" className={`btn-auth ${justSucceeded ? 'succeeded' : ''}`} disabled={loading}>
                  {justSucceeded ? (
                    <><IconCheck size={20} /> {isLogin ? 'Signed in!' : 'Account created!'}</>
                  ) : loading ? (
                    <><span className="spinner" /> {isLogin ? 'Signing in...' : 'Creating account...'}</>
                  ) : (
                    <>{isLogin ? 'Sign in' : 'Create your store'}<IconArrow size={18} /></>
                  )}
                </button>
              </form>

              <div className="auth-divider">OR CONTINUE WITH</div>

              <div className="social-btns">
                <button type="button" className="social-btn" onClick={() => addToast('Google sign-in coming soon!', 'info')}>
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
                <button type="button" className="social-btn" onClick={() => addToast('Apple sign-in coming soon!', 'info')}>
                  <span className="social-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.7 12.9c-.1-3.5 2.8-5.2 2.9-5.3-1.6-2.3-4.1-2.6-5-2.7-2.1-.2-4.1 1.2-5.2 1.2s-2.7-1.2-4.5-1.2C5 5 2.6 7.2 2.6 10.5c0 2.9 2.4 7.2 4.6 7.2 1.7 0 2.2-1 4.2-1s2.6 1 4.4 1c1.9 0 3.7-2.5 3.7-3.9zM15.7 4.7c1.3-1.6 1.2-2.9 1.2-3.3-1.1.1-2.5.7-3.3 1.6-.8.9-1.3 2.1-1.2 3.3 1.2.1 2.5-.6 3.3-1.6z" />
                    </svg>
                  </span>
                  Apple
                </button>
              </div>

              <div className="auth-footer">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button type="button" onClick={toggleMode}>
                  {isLogin ? 'Start your free store' : 'Sign in'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

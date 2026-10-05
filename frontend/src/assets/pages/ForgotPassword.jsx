import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  // 5 minute countdown
  const [timeLeft, setTimeLeft] = useState(300);

  // ==============================
  // OTP COUNTDOWN
  // ==============================

  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formattedTime = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  // ==============================
  // SEND OTP
  // ==============================

  const handleSendOtp = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_BASE}/api/auth/forgot-password`,
        {
          email,
        },
      );

      setMessage(response.data.message);

      setTimeLeft(300);

      setStep(2);
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // VERIFY OTP
  // ==============================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    if (timeLeft <= 0) {
      setError('OTP has expired. Please request a new OTP.');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
        email,
        otp,
      });

      setMessage(response.data.message);

      setStep(3);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // RESET PASSWORD
  // ==============================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_BASE}/api/auth/reset-password`, {
        email: email.trim(),
        newPassword,
        confirmPassword,
      });

      console.log('Password reset response:', response.data);

      setMessage(response.data.message);

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error(
        'Reset password error:',
        error.response?.data || error.message,
      );

      setError(error.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // RESEND OTP
  // ==============================

  const handleResendOtp = async () => {
    try {
      setError('');
      setMessage('');
      setLoading(true);

      const response = await axios.post(
        `${API_BASE}/api/auth/forgot-password`,
        {
          email,
        },
      );

      setMessage('New OTP sent successfully.');

      setOtp('');

      setTimeLeft(300);
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        min-h-screen
        w-full
        bg-slate-100
        flex
        items-center
        justify-center
        px-4
        py-8
        sm:px-6
        lg:px-8
      "
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div
          className="
            bg-white
            rounded-2xl
            shadow-xl
            border
            border-slate-200
            px-5
            py-7
            sm:px-8
            sm:py-9
          "
        >
          {/* Back */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="
              flex
              items-center
              gap-2
              text-sm
              text-slate-500
              hover:text-blue-600
              transition
              mb-6
            "
          >
            <ArrowLeft size={17} />
            Back to Login
          </button>

          {/* ==============================
              STEP INDICATOR
          ============================== */}

          <div className="flex items-center justify-center mb-8">
            <div
              className={`
                w-9 h-9
                rounded-full
                flex items-center justify-center
                text-sm font-semibold
                ${
                  step >= 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }
              `}
            >
              1
            </div>

            <div className="w-10 sm:w-14 h-px bg-slate-300" />

            <div
              className={`
                w-9 h-9
                rounded-full
                flex items-center justify-center
                text-sm font-semibold
                ${
                  step >= 2
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }
              `}
            >
              2
            </div>

            <div className="w-10 sm:w-14 h-px bg-slate-300" />

            <div
              className={`
                w-9 h-9
                rounded-full
                flex items-center justify-center
                text-sm font-semibold
                ${
                  step >= 3
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }
              `}
            >
              3
            </div>
          </div>

          {/* ==============================
              STEP 1
          ============================== */}

          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="text-center mb-7">
                <div
                  className="
                    mx-auto
                    w-14 h-14
                    rounded-full
                    bg-blue-50
                    flex items-center justify-center
                    text-blue-600
                    mb-4
                  "
                >
                  <Mail size={27} />
                </div>

                <h2
                  className="
                    text-2xl
                    sm:text-3xl
                    font-bold
                    text-slate-800
                  "
                >
                  Forgot Password?
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-500
                    leading-relaxed
                  "
                >
                  Enter your registered employee email and we'll send you a
                  verification OTP.
                </p>
              </div>

              <label
                className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-2
                "
              >
                Employee Email
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="
                    w-full
                    h-12
                    pl-10
                    pr-4
                    rounded-lg
                    border
                    border-slate-300
                    outline-none
                    text-sm
                    sm:text-base
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                    transition
                  "
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  h-12
                  mt-6
                  rounded-lg
                  bg-blue-600
                  hover:bg-blue-700
                  disabled:bg-blue-300
                  text-white
                  font-semibold
                  transition
                "
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* ==============================
              STEP 2
          ============================== */}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="text-center mb-7">
                <div
                  className="
                    mx-auto
                    w-14 h-14
                    rounded-full
                    bg-blue-50
                    flex items-center justify-center
                    text-blue-600
                    mb-4
                  "
                >
                  <ShieldCheck size={28} />
                </div>

                <h2
                  className="
                    text-2xl
                    sm:text-3xl
                    font-bold
                    text-slate-800
                  "
                >
                  Verify OTP
                </h2>

                <p
                  className="
                  mt-2
                  text-sm
                  text-slate-500
                  break-all
                "
                >
                  OTP sent to {email}
                </p>
              </div>

              <label
                className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-2
                "
              >
                Enter 6-digit OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="000000"
                className="
                  w-full
                  h-14
                  rounded-lg
                  border
                  border-slate-300
                  text-center
                  text-xl
                  sm:text-2xl
                  font-semibold
                  tracking-[0.5em]
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />

              {/* Timer */}

              <div className="text-center mt-4">
                {timeLeft > 0 ? (
                  <p className="text-sm text-slate-500">
                    OTP expires in{' '}
                    <span className="font-semibold text-red-500">
                      {formattedTime}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-red-500">OTP has expired</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || timeLeft <= 0}
                className="
                  w-full
                  h-12
                  mt-5
                  rounded-lg
                  bg-blue-600
                  hover:bg-blue-700
                  disabled:bg-slate-300
                  text-white
                  font-semibold
                  transition
                "
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleResendOtp}
                className="
                  w-full
                  mt-4
                  text-sm
                  font-medium
                  text-blue-600
                  hover:text-blue-700
                  hover:underline
                "
              >
                Resend OTP
              </button>
            </form>
          )}

          {/* ==============================
              STEP 3
          ============================== */}

          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="text-center mb-7">
                <div
                  className="
                    mx-auto
                    w-14 h-14
                    rounded-full
                    bg-green-50
                    flex items-center justify-center
                    text-green-600
                    mb-4
                  "
                >
                  <Lock size={27} />
                </div>

                <h2
                  className="
                    text-2xl
                    sm:text-3xl
                    font-bold
                    text-slate-800
                  "
                >
                  Create New Password
                </h2>

                <p
                  className="
                  mt-2
                  text-sm
                  text-slate-500
                "
                >
                  Enter your new password below.
                </p>
              </div>

              {/* New Password */}

              <label
                className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-2
                "
              >
                New Password
              </label>

              <div className="relative mb-5">
                <Lock
                  size={19}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="
                    w-full
                    h-12
                    pl-10
                    pr-12
                    rounded-lg
                    border
                    border-slate-300
                    outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    hover:text-slate-700
                  "
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Confirm Password */}

              <label
                className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-2
                "
              >
                Confirm Password
              </label>

              <div className="relative">
                <Lock
                  size={19}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="
                    w-full
                    h-12
                    pl-10
                    pr-12
                    rounded-lg
                    border
                    border-slate-300
                    outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    hover:text-slate-700
                  "
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>

              <p
                className="
                mt-2
                text-xs
                text-slate-400
              "
              >
                Password must contain at least 6 characters.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  h-12
                  mt-6
                  rounded-lg
                  bg-green-600
                  hover:bg-green-700
                  disabled:bg-green-300
                  text-white
                  font-semibold
                  transition
                "
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* ==============================
              MESSAGE
          ============================== */}

          {message && (
            <div
              className="
              mt-5
              p-3
              rounded-lg
              bg-green-50
              border
              border-green-200
              text-green-700
              text-sm
              text-center
            "
            >
              {message}
            </div>
          )}

          {error && (
            <div
              className="
              mt-5
              p-3
              rounded-lg
              bg-red-50
              border
              border-red-200
              text-red-700
              text-sm
              text-center
            "
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

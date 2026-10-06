import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5005'
).replace(/\/+$/, '');

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, formData);

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Save tokens
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);

      const userRole = res.data.role;

      setMessage('Login successful!');

      // Redirect based on role
      if (userRole === 'employee') {
        navigate('/employee-dashboard', {
          replace: true,
        });
      } else if (userRole === 'admin') {
        navigate('/admin-dashboard', {
          replace: true,
        });
      } else if (userRole === 'hr_manager') {
        navigate('/hr-dashboard', {
          replace: true,
        });
      } else if (userRole === 'team_leader') {
        navigate('/team-dashboard', {
          replace: true,
        });
      } else if (userRole === 'super_admin') {
        navigate('/super-dashboard', {
          replace: true,
        });
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error logging in');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      {/* Login Card */}
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="
            bg-white
            rounded-2xl
            shadow-xl
            border border-slate-200
            px-5 py-6
            sm:px-8 sm:py-9
            md:px-10
          "
        >
          {/* Header */}
          <div className="text-center mb-7 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Welcome
            </h2>

            <p className="mt-2 text-sm sm:text-base text-slate-500">
              Sign in to your account
            </p>
          </div>

          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-slate-700"
            >
              Email
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
                  pointer-events-none
                "
              />

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="
                  w-full
                  h-12
                  pl-10 pr-4
                  rounded-lg
                  border border-slate-300
                  bg-white
                  text-sm sm:text-base
                  text-slate-800
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  placeholder:text-slate-400
                "
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-slate-700"
            >
              Password
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
                  pointer-events-none
                "
              />

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="
                  w-full
                  h-12
                  pl-10 pr-12
                  rounded-lg
                  border border-slate-300
                  bg-white
                  text-sm sm:text-base
                  text-slate-800
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  placeholder:text-slate-400
                "
              />

              {/* Eye Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  p-1
                  text-slate-400
                  hover:text-slate-700
                  transition
                  focus:outline-none
                "
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end mb-6">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="
                text-sm
                font-medium
                text-blue-600
                hover:text-blue-700
                hover:underline
                transition
              "
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="
              w-full
              h-12
              rounded-lg
              bg-blue-600
              hover:bg-blue-700
              active:bg-blue-800
              text-white
              font-semibold
              text-sm sm:text-base
              transition
              duration-200
              shadow-sm
              hover:shadow-md
            "
          >
            Login
          </button>

          {/* Message */}
          {message && (
            <div
              className={`
                mt-5
                rounded-lg
                px-4 py-3
                text-sm
                text-center
                ${
                  message.toLowerCase().includes('successful')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }
              `}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

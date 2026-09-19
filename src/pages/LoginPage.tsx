import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LogoMark, IcEye, IcEyeOff, IcSpin } from '../icons';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by auth context
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <LogoMark size={40} />
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-disp)' }}>MockForge</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>Welcome Back</h1>
          <p style={{ color: 'var(--color-mut)' }}>Log in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm anim-fade-in">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-mut"
              >
                {showPassword ? <IcEyeOff size={18} /> : <IcEye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-acc"
              />
              <span className="text-sm">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-acc hover:underline">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-acc w-full justify-center !py-3"
          >
            {isLoading ? (
              <>
                <IcSpin size={16} />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-acc hover:underline font-medium">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

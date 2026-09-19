import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LogoMark, IcEye, IcEyeOff, IcSpin, IcCheck } from '../icons';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'var(--color-danger)' };
  if (score <= 4) return { score, label: 'Medium', color: 'var(--color-gold)' };
  return { score, label: 'Strong', color: 'var(--color-acc2)' };
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (password !== confirmPassword) {
      return;
    }
    
    try {
      await signup(name, email, password);
      navigate('/verify-email');
    } catch (err) {
      // Error is handled by auth context
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <LogoMark size={40} />
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-disp)' }}>MockForge</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>Create Account</h1>
          <p style={{ color: 'var(--color-mut)' }}>Start creating professional mockups</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm anim-fade-in">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="John Doe"
              required
              autoFocus
            />
          </div>

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
                placeholder="Create a password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-mut"
              >
                {showPassword ? <IcEyeOff size={18} /> : <IcEye size={18} />}
              </button>
            </div>
            
            {/* Password Strength */}
            {password && (
              <div className="mt-2 anim-fade-in">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--color-dim)' }}>Password strength:</span>
                  <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{
                        backgroundColor: i <= passwordStrength.score ? passwordStrength.color : 'var(--color-line)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pr-10"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-mut"
              >
                {showConfirmPassword ? <IcEyeOff size={18} /> : <IcEye size={18} />}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className="mt-2 flex items-center gap-2 anim-fade-in">
                {passwordsMatch ? (
                  <>
                    <IcCheck size={14} />
                    <span className="text-xs" style={{ color: 'var(--color-acc2)' }}>Passwords match</span>
                  </>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--color-danger)' }}>Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !passwordsMatch}
            className="btn btn-acc w-full justify-center !py-3"
          >
            {isLoading ? (
              <>
                <IcSpin size={16} />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-acc hover:underline font-medium">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

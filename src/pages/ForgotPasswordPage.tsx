import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LogoMark, IcSpin, IcArrowL } from '../icons';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      // Error is handled by auth context
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <LogoMark size={40} />
              <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-disp)' }}>MockForge</span>
            </Link>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>Check Your Email</h1>
            <p style={{ color: 'var(--color-mut)' }}>
              We've sent a password reset code to<br />
              <span className="font-medium text-fg">{email}</span>
            </p>
          </div>

          {/* Success Message */}
          <div className="card p-6 space-y-4">
            <div className="p-4 rounded-lg border border-acc2/30 bg-acc2/10 text-acc2 text-sm">
              If an account exists for {email}, you will receive a password reset code shortly.
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/reset-password')}
                className="btn btn-acc w-full justify-center !py-3"
              >
                Enter Reset Code
              </button>
              
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="btn w-full justify-center !py-3"
              >
                <IcArrowL size={14} />
                Try Different Email
              </button>
            </div>
          </div>

          {/* Back to Login */}
          <p className="text-center mt-6">
            <Link to="/login" className="text-acc hover:underline font-medium">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <LogoMark size={40} />
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-disp)' }}>MockForge</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>Forgot Password?</h1>
          <p style={{ color: 'var(--color-mut)' }}>No worries, we'll send you reset instructions</p>
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-acc w-full justify-center !py-3"
          >
            {isLoading ? (
              <>
                <IcSpin size={16} />
                Sending code...
              </>
            ) : (
              'Send Reset Code'
            )}
          </button>
        </form>

        {/* Back to Login */}
        <p className="text-center mt-6">
          <Link to="/login" className="text-acc hover:underline font-medium">
            <IcArrowL size={14} className="inline mr-1" />
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

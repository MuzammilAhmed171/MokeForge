import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LogoMark, IcSpin, IcCheck } from '../icons';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, verifyEmail, resendOTP, isLoading, error, clearError } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    clearError();

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);
    clearError();

    // Focus last filled input or next empty input
    const lastFilledIndex = pastedData.length - 1;
    inputRefs.current[Math.min(lastFilledIndex + 1, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      return;
    }

    try {
      await verifyEmail(otpString);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by auth context
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    try {
      await resendOTP();
      setResendCountdown(30);
      setCanResend(false);
    } catch (err) {
      // Error is handled by auth context
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <LogoMark size={40} />
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-disp)' }}>MockForge</span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>Verify Your Email</h1>
          <p style={{ color: 'var(--color-mut)' }}>
            We've sent a verification code to<br />
            <span className="font-medium text-fg">{user?.email}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          {/* Success Message */}
          <div className="p-3 rounded-lg border border-acc2/30 bg-acc2/10 text-acc2 text-sm">
            <div className="flex items-center gap-2">
              <IcCheck size={16} />
              <span>Check your email for the verification code</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm anim-fade-in">
              {error}
            </div>
          )}

          {/* OTP Inputs */}
          <div>
            <label className="block text-sm font-medium mb-3">Enter 6-digit code</label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-line bg-ink focus:border-acc focus:ring-2 focus:ring-acc/20 outline-none transition-all"
                  style={{ color: 'var(--color-fg)' }}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="btn btn-acc w-full justify-center !py-3"
          >
            {isLoading ? (
              <>
                <IcSpin size={16} />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Resend */}
          <div className="text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-sm text-acc hover:underline font-medium"
              >
                Resend Code
              </button>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-dim)' }}>
                Resend code in <span className="font-medium text-fg">{resendCountdown}s</span>
              </p>
            )}
          </div>
        </form>

        {/* Help Text */}
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-dim)' }}>
          Didn't receive the email? Check your spam folder or{' '}
          <button onClick={handleResend} disabled={!canResend} className="text-acc hover:underline font-medium">
            resend code
          </button>
        </p>
      </div>
    </div>
  );
}

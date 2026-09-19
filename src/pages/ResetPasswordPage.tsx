import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LogoMark, IcSpin, IcEye, IcEyeOff, IcCheck, IcArrowL } from '../icons';

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

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { verifyResetOTP, resetPassword, resendOTP, forgotPassword, isLoading, error, clearError } = useAuth();
  
  const email = sessionStorage.getItem('resetEmail') || '';
  const [step, setStep] = useState<1 | 2>(1); // 1: Enter OTP, 2: Enter New Password
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If no email in session, redirect to forgot password
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (step === 1) {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleOTPChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    clearError();

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);
    clearError();

    const lastFilledIndex = pastedData.length - 1;
    inputRefs.current[Math.min(lastFilledIndex + 1, 5)]?.focus();
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setResendStatus(null);

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      return;
    }

    try {
      await verifyResetOTP(email, otpString);
      setStep(2);
    } catch (err) {
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    clearError();
    setResendStatus(null);
    try {
      await forgotPassword(email);
      setResendStatus('A new code has been sent to your email.');
    } catch (err) {
      // Error handled in auth context
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setStep(1);
      return;
    }

    if (newPassword.length < 6) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    try {
      await resetPassword(email, otpString, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      // If OTP failed during final reset, go back to step 1
      if (err instanceof Error && err.message.toLowerCase().includes('otp')) {
        setStep(1);
        setOtp(['', '', '', '', '', '']);
      }
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  if (success) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-acc2/20 mb-4">
              <IcCheck size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>Password Reset!</h1>
            <p style={{ color: 'var(--color-mut)' }}>
              Your password has been successfully reset.<br />
              Redirecting to login...
            </p>
          </div>
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
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>
            {step === 1 ? 'Verify Reset Code' : 'Set New Password'}
          </h1>
          <p style={{ color: 'var(--color-mut)' }}>
            {step === 1
              ? 'Enter the 6-digit code sent to your email'
              : 'Create a new secure password for your account'}
          </p>
        </div>

        {/* STEP 1: OTP VERIFICATION ONLY */}
        {step === 1 && (
          <form onSubmit={handleVerifyOTP} className="card p-6 space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm anim-fade-in">
                {error}
              </div>
            )}

            {/* Resend success notice */}
            {resendStatus && (
              <div className="p-3 rounded-lg border border-acc2/30 bg-acc2/10 text-acc2 text-sm anim-fade-in">
                {resendStatus}
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium mb-3 text-center">Reset Code</label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    onPaste={handleOTPPaste}
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
                  Verifying code...
                </>
              ) : (
                'Verify Code'
              )}
            </button>

            {/* Resend link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-sm text-dim hover:text-acc transition-colors font-medium"
              >
                Didn't receive code? Resend
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: NEW PASSWORD ONLY (Appears after verifying OTP) */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="card p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm anim-fade-in">
                {error}
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  autoFocus
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
              {newPassword && (
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
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="Confirm new password"
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
              disabled={isLoading || newPassword.length < 6 || !passwordsMatch}
              className="btn btn-acc w-full justify-center !py-3"
            >
              {isLoading ? (
                <>
                  <IcSpin size={16} />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <p className="text-center mt-6">
          <Link to="/login" className="text-acc hover:underline font-medium inline-flex items-center gap-1">
            <IcArrowL size={14} />
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

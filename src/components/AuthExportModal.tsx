import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useStudio } from '../store';
import { LogoMark, IcLock, IcCheck, IcClose, IcEye, IcEyeOff, IcSpin, IcDownload, IcSpark, IcAlert } from '../icons';
import confetti from 'canvas-confetti';

interface AuthExportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pendingAction?: 'download' | 'copy' | null;
}

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

export function AuthExportModal({ open, onClose, onSuccess, pendingAction = 'download' }: AuthExportModalProps) {
  const { login, signup, verifyEmail, resendOTP, isLoading } = useAuth();
  const project = useStudio(s => s.project);
  const syncGuestProjectToAccount = useStudio(s => s.syncGuestProjectToAccount);
  const toast = useStudio(s => s.toast);

  const [mode, setMode] = useState<'login' | 'signup' | 'otp'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // LOCAL error state — completely independent of AuthContext's error
  // This prevents AuthContext re-renders from wiping our error
  const [localError, setLocalError] = useState<string | null>(null);

  // Field-specific validation errors derived from localError
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; name?: string; confirmPassword?: string }>({});

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Password helpers
  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = !password || !confirmPassword || password === confirmPassword;

  // Derive field-level errors from localError
  useEffect(() => {
    if (!localError) {
      setFieldErrors({});
      return;
    }
    const lower = localError.toLowerCase();
    const newFieldErrors: { email?: string; password?: string; name?: string } = {};

    // "Invalid email or password" → highlight both fields
    if (lower.includes('invalid email or password') || lower.includes('invalid credentials')) {
      newFieldErrors.email = localError;
      newFieldErrors.password = localError;
    } else {
      if (lower.includes('email') || lower.includes('user already exists') || lower.includes('not found') || lower.includes('already exist')) {
        newFieldErrors.email = localError;
      }
      if (lower.includes('password')) {
        newFieldErrors.password = localError;
      }
      if (lower.includes('name')) {
        newFieldErrors.name = localError;
      }
    }

    // If no specific field matched, put it on a generic level (banner only)
    setFieldErrors(newFieldErrors);
  }, [localError]);

  const clearLocalError = useCallback(() => {
    setLocalError(null);
    setFieldErrors({});
  }, []);

  // Input change handlers — clear errors on edit
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (localError) clearLocalError();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (localError) clearLocalError();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (localError) clearLocalError();
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
  };

  // Countdown timer for OTP
  useEffect(() => {
    if (mode === 'otp' && resendCountdown > 0) {
      const t = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(t);
    } else if (mode === 'otp') {
      setCanResend(true);
    }
  }, [mode, resendCountdown]);

  // Only manage body overflow on open/close — NO clearError dependency!
  useEffect(() => {
    if (open) {
      clearLocalError();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handlePostAuthSuccess = async () => {
    try {
      await syncGuestProjectToAccount();
    } catch {
      // Best-effort
    }

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6b3d', '#45d6c8', '#ffd166', '#ffffff'],
      });
    } catch {
      // Best effort
    }

    toast(
      pendingAction === 'copy'
        ? 'Account connected! Copying mockup to clipboard...'
        : 'Account connected! Downloading your mockup...',
      'ok'
    );
    onClose();
    onSuccess();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearLocalError();
    try {
      await login(email, password);
      await handlePostAuthSuccess();
    } catch (err: any) {
      // Set error LOCALLY so it persists regardless of AuthContext re-renders
      const msg = err instanceof Error ? err.message : 'Login failed';
      setLocalError(msg);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearLocalError();
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    try {
      await signup(name, email, password);
      setMode('otp');
      setResendCountdown(30);
      setCanResend(false);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      setLocalError(msg);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val && !/^\d$/.test(val)) return;
    const nextOtp = [...otp];
    nextOtp[index] = val;
    setOtp(nextOtp);
    if (localError) clearLocalError();
    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const nextOtp = pasted.split('').concat(Array(6 - pasted.length).fill(''));
    setOtp(nextOtp);
    if (localError) clearLocalError();
    const targetIdx = Math.min(pasted.length, 5);
    otpInputsRef.current[targetIdx]?.focus();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearLocalError();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    try {
      await verifyEmail(otpCode);
      await handlePostAuthSuccess();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setLocalError(msg);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      await resendOTP();
      setResendCountdown(30);
      setCanResend(false);
      toast('Verification code resent to your email');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Failed to resend OTP';
      setLocalError(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 anim-fade-in"
      style={{ background: 'rgba(8,9,11,0.85)', backdropFilter: 'blur(8px)' }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="anim-pop w-[500px] max-w-[96vw] max-h-[92vh] overflow-y-auto rounded-2xl border border-line bg-panel shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line2 bg-ink/50 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <LogoMark size={24} />
            <span className="font-bold text-sm tracking-wide" style={{ fontFamily: 'var(--font-disp)' }}>
              MOCK FORGE
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-acc/10 text-acc border border-acc/25 flex items-center gap-1">
              <IcLock size={10} />
              Export Locked
            </span>
          </div>
          <button className="icon-btn !w-7 !h-7" onClick={onClose} title="Close">
            <IcClose size={15} />
          </button>
        </div>

        <div className="p-6 md:p-7 space-y-5">
          {/* Headline & Explanation */}
          <div>
            <h2 className="text-2xl font-bold mb-1.5" style={{ fontFamily: 'var(--font-disp)' }}>
              {mode === 'otp'
                ? 'Verify Email to Download'
                : mode === 'signup'
                ? 'Create Free Account'
                : 'Log In to Export Mockup'}
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-mut)' }}>
              {mode === 'otp'
                ? `Enter the 6-digit code sent to ${email} to unlock immediate high-res download.`
                : 'Sign in or register to export high-res files. Your current canvas design is 100% preserved.'}
            </p>
          </div>

          {/* Project Preservation Badge */}
          {project && mode !== 'otp' && (
            <div className="p-3.5 rounded-xl border border-acc2/30 bg-acc2/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-acc2/15 flex items-center justify-center text-acc2 shrink-0">
                <IcSpark size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-fg flex items-center gap-1.5 truncate">
                  <span className="truncate">{project.name || 'Untitled project'}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ink text-dim border border-line">
                    {project.canvas.w}×{project.canvas.h}
                  </span>
                </div>
                <div className="text-[11px] text-acc2 flex items-center gap-1 mt-0.5">
                  <IcCheck size={12} />
                  <span>Your design is safely stored · Automatically synced upon sign in</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner — uses LOCAL error, not AuthContext error */}
          {localError && (
            <div className="p-3 rounded-lg border border-danger/40 bg-danger/10 text-danger text-xs anim-fade-in flex items-start gap-2.5">
              <div className="shrink-0 mt-0.5">
                <IcAlert size={15} />
              </div>
              <div className="flex-1 font-medium">{localError}</div>
              <button
                type="button"
                onClick={clearLocalError}
                className="text-danger hover:text-fg opacity-70 hover:opacity-100 transition-opacity shrink-0"
              >
                <IcClose size={13} />
              </button>
            </div>
          )}

          {/* Tab Switcher (Login / Signup) */}
          {mode !== 'otp' && (
            <div className="flex rounded-lg border border-line p-1 bg-ink">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearLocalError();
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-panel text-fg shadow-sm' : 'text-mut hover:text-fg'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  clearLocalError();
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'signup' ? 'bg-panel text-fg shadow-sm' : 'text-mut hover:text-fg'
                }`}
              >
                Create Free Account
              </button>
            </div>
          )}

          {/* Mode: LOG IN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`input !text-xs !py-2.5 ${fieldErrors.email ? '!border-danger focus:!ring-danger/30' : ''}`}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
                {fieldErrors.email && (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <span>•</span> {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium">Password</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    className={`input !text-xs !py-2.5 pr-10 ${fieldErrors.password ? '!border-danger focus:!ring-danger/30' : ''}`}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-mut"
                  >
                    {showPassword ? <IcEyeOff size={16} /> : <IcEye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && !fieldErrors.email && (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <span>•</span> {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-acc w-full justify-center !py-2.5 mt-2 text-xs font-medium cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <IcSpin size={15} />
                    Logging in...
                  </>
                ) : (
                  <>
                    <IcDownload size={15} />
                    Log In &amp; {pendingAction === 'copy' ? 'Copy Design' : 'Download Mockup'}
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-dim pt-1">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    clearLocalError();
                  }}
                  className="text-acc hover:underline font-medium cursor-pointer"
                >
                  Create one free
                </button>
              </p>
            </form>
          )}

          {/* Mode: SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={`input !text-xs !py-2 ${fieldErrors.name ? '!border-danger focus:!ring-danger/30' : ''}`}
                  placeholder="John Doe"
                  required
                  autoFocus
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <span>•</span> {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`input !text-xs !py-2 ${fieldErrors.email ? '!border-danger focus:!ring-danger/30' : ''}`}
                  placeholder="you@example.com"
                  required
                />
                {fieldErrors.email && (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <span>•</span> {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    className={`input !text-xs !py-2 pr-9 ${fieldErrors.password ? '!border-danger focus:!ring-danger/30' : ''}`}
                    placeholder="Create a password (min 6 chars)"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim hover:text-mut"
                  >
                    {showPassword ? <IcEyeOff size={15} /> : <IcEye size={15} />}
                  </button>
                </div>
                {password && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="flex gap-1 flex-1">
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
                    <span className="text-[10px] font-medium" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
                {fieldErrors.password && (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <span>•</span> {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`input !text-xs !py-2 pr-9 ${fieldErrors.confirmPassword || (!passwordsMatch && confirmPassword) ? '!border-danger focus:!ring-danger/30' : ''}`}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim hover:text-mut"
                  >
                    {showConfirmPassword ? <IcEyeOff size={15} /> : <IcEye size={15} />}
                  </button>
                </div>
                {(!passwordsMatch && confirmPassword) ? (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <span>•</span> Passwords do not match
                  </p>
                ) : fieldErrors.confirmPassword ? (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <span>•</span> {fieldErrors.confirmPassword}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isLoading || !passwordsMatch || !password || !confirmPassword}
                className="btn btn-acc w-full justify-center !py-2.5 mt-2 text-xs font-medium cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <IcSpin size={15} />
                    Creating account...
                  </>
                ) : (
                  <>
                    <IcDownload size={15} />
                    Register &amp; Unlock Download
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-dim pt-1">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearLocalError();
                  }}
                  className="text-acc hover:underline font-medium cursor-pointer"
                >
                  Log In
                </button>
              </p>
            </form>
          )}

          {/* Mode: OTP VERIFICATION */}
          {mode === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="p-3 rounded-lg border border-acc2/30 bg-acc2/10 text-acc2 text-xs flex items-center gap-2">
                <IcCheck size={15} />
                <span>Verification code sent to {email}</span>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2.5 text-center">
                  Enter 6-digit verification code
                </label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpInputsRef.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-line bg-ink focus:border-acc focus:ring-2 focus:ring-acc/20 outline-none transition-all text-fg"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="btn btn-acc w-full justify-center !py-2.5 text-xs font-medium cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <IcSpin size={15} />
                    Verifying &amp; downloading...
                  </>
                ) : (
                  <>
                    <IcCheck size={15} />
                    Verify &amp; Download Mockup
                  </>
                )}
              </button>

              <div className="text-center text-xs">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-acc hover:underline font-medium text-xs cursor-pointer"
                  >
                    Resend code
                  </button>
                ) : (
                  <span className="text-dim text-[11px]">
                    Resend code in <span className="font-semibold text-fg">{resendCountdown}s</span>
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

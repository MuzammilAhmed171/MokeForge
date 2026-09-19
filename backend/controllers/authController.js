import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    await OTP.create({
      user: user._id,
      otp,
      type: 'email-verification',
      expiresAt
    });

    // Send verification email
    await sendVerificationEmail(email, name, otp);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User created successfully. Please check your email for verification code.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Private
export const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    // Find OTP
    const otpRecord = await OTP.findOne({
      user: userId,
      type: 'email-verification',
      otp
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check if expired
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Update user
    await User.findByIdAndUpdate(userId, { emailVerified: true });

    // Delete OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
// @access  Private
export const resendOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Delete any existing OTPs
    await OTP.deleteMany({ user: userId, type: 'email-verification' });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP
    await OTP.create({
      user: userId,
      otp,
      type: 'email-verification',
      expiresAt
    });

    // Send email
    await sendVerificationEmail(user.email, user.name, otp);

    res.json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending OTP'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, a reset code has been sent.'
      });
    }

    // Delete any existing reset OTPs
    await OTP.deleteMany({ user: user._id, type: 'password-reset' });

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP
    await OTP.create({
      user: user._id,
      otp,
      type: 'password-reset',
      expiresAt
    });

    // Send email
    await sendPasswordResetEmail(email, user.name, otp);

    res.json({
      success: true,
      message: 'If an account exists with this email, a reset code has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    // Find OTP
    const otpRecord = await OTP.findOne({
      user: user._id,
      type: 'password-reset',
      otp
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check if expired
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Delete OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // In JWT-based auth, logout is handled on frontend by removing token
    // But we can update last logout time if needed
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

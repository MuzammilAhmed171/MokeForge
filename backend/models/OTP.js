import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email-verification', 'password-reset'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - auto delete after expiry
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
otpSchema.index({ user: 1, type: 1, expiresAt: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;

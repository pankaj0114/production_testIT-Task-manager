// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // ==============================
    // BASIC USER INFORMATION
    // ==============================
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },

    // ==============================
    // PASSWORD
    // ==============================
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    // ==============================
    // ROLE
    // ==============================
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'hr_manager', 'employee'],
      default: 'employee',
      required: true,
    },

    // ==============================
    // DEPARTMENT
    // ==============================
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },

    // ==============================
    // DATE OF BIRTH
    // ==============================
    dateOfBirth: {
      type: Date,
    },

    dateOfJoining: {
      type: Date,
      default: null,
    },

    // ==============================
    // FORGOT PASSWORD / OTP
    // ==============================

    // 6-digit OTP
    resetPasswordOtp: {
      type: String,
      default: null,
      select: false,
    },

    // OTP expiration time
    // Controller will set this to:
    // Date.now() + 5 minutes
    resetPasswordOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Becomes true only after successful OTP verification
    resetPasswordVerified: {
      type: Boolean,
      default: false,
      select: false,
    },

    // ==============================
    // OTHER USER INFORMATION
    // ==============================
    designation: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ==============================
    // REFRESH TOKENS
    // ==============================
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
          expires: '30d',
        },

        userAgent: String,

        ip: String,
      },
    ],

    // ==============================
    // PASSWORD INFORMATION
    // ==============================
    passwordChangedAt: {
      type: Date,
    },

    // ==============================
    // OPTIONAL PASSWORD RESET TOKEN
    // ==============================
    passwordResetToken: {
      type: String,
    },

    passwordResetExpires: {
      type: Date,
    },

    // ==============================
    // LOGIN INFORMATION
    // ==============================
    lastLogin: {
      type: Date,
    },
  },

  {
    timestamps: true,
  },
);

// ==============================
// INDEXES
// ==============================

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

const User = mongoose.model('User', userSchema);

export default User;

//import User from '../../../TaskAssignmentProductionTest/backend/models/User.js';
//import Notification from '../models/Notification.js';
import bcrypt from 'bcryptjs'; // use bcryptjs

import mongoose from 'mongoose';
import User from '../../../TaskAssignmentProductionTest/backend/models/User.js';

import jwt from 'jsonwebtoken';
import Notification from '../../../TaskAssignmentProductionTest/backend/models/Notification.js';
import crypto from 'crypto';
import transporter from '../../../TaskAssignmentProductionTest/backend/config/mailer.js';

// Register new user

export const registerUser = async (req, res) => {
  console.log('🔥 registerUser controller reached');
  console.log('Request body:', req.body);

  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    console.log('Existing user:', existingUser);

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Password hashed successfully');

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    console.log('Saving user...');

    await newUser.save();

    console.log('User saved successfully');

    return res.status(201).json({
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('❌ REGISTER ERROR:', error);

    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};
// ✅ Login controller
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('Mongoose state:', mongoose.connection.readyState);
    console.log('User model state:', User.db.readyState);
    console.log('User DB:', User.db.name);
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    // ✅ Include email + role in payload
    const accessToken = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '3h' },
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      accessToken,
      refreshToken,
      role: user.role,
      name: user.name,
      email: user.email, // ✅ send email explicitly too
      id: user._id,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Refresh token controller
export const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token)
    return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );
    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// ✅ Logout user (must be exported)
export const logoutUser = async (req, res) => {
  // If you’re not storing refresh tokens in DB, you can just respond success
  res.json({ message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('Forgot password request:', email);

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find employee
    const user = await User.findOne({
      email: normalizedEmail,
      role: 'employee',
    });

    if (!user) {
      return res.status(400).json({
        message: 'This password reset option is available for employees only.',
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    console.log('Generated OTP:', otp);

    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10);

    // OTP expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordOtpExpires = expiresAt;
    user.resetPasswordVerified = false;

    await user.save();

    console.log('OTP saved successfully');

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Employee Password Reset OTP',

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
        ">

          <h2 style="color: #1e293b;">
            Password Reset Request
          </h2>

          <p>Hello ${user.name},</p>

          <p>
            We received a request to reset your password.
          </p>

          <p>Your verification OTP is:</p>

          <div style="
            text-align: center;
            margin: 25px 0;
          ">
            <span style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #2563eb;
            ">
              ${otp}
            </span>
          </div>

          <p>
            This OTP will expire in
            <strong>5 minutes</strong>.
          </p>

          <p>
            If you did not request this password reset,
            please ignore this email.
          </p>

          <hr />

          <p style="font-size: 12px; color: #64748b;">
            This is an automated email. Please do not reply.
          </p>

        </div>
      `,
    });

    console.log('OTP email sent successfully');

    return res.status(200).json({
      message: 'OTP sent successfully to your email.',
    });
  } catch (error) {
    console.error('=================================');
    console.error('FORGOT PASSWORD ERROR');
    console.error(error);
    console.error('=================================');

    return res.status(500).json({
      message: 'Unable to send OTP.',
      error: error.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('VERIFY OTP REQUEST:', {
      email,
      otp,
    });

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // IMPORTANT:
    // Explicitly select fields that are select:false
    const user = await User.findOne({
      email: normalizedEmail,
      role: 'employee',
    }).select(
      '+resetPasswordOtp +resetPasswordOtpExpires +resetPasswordVerified',
    );

    console.log('USER FOUND:', !!user);

    if (!user) {
      return res.status(400).json({
        message: 'Invalid OTP.',
      });
    }

    console.log('OTP HASH EXISTS:', !!user.resetPasswordOtp);
    console.log('OTP EXPIRES:', user.resetPasswordOtpExpires);
    console.log('OTP VERIFIED:', user.resetPasswordVerified);

    if (!user.resetPasswordOtp) {
      return res.status(400).json({
        message: 'OTP not found. Please request a new OTP.',
      });
    }

    // Check 5-minute expiration
    if (
      !user.resetPasswordOtpExpires ||
      user.resetPasswordOtpExpires.getTime() < Date.now()
    ) {
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpires = null;
      user.resetPasswordVerified = false;

      await user.save();

      return res.status(400).json({
        message: 'OTP has expired. Please request a new OTP.',
      });
    }

    // Compare entered OTP with hashed OTP
    const isValidOtp = await bcrypt.compare(String(otp), user.resetPasswordOtp);

    console.log('OTP VALID:', isValidOtp);

    if (!isValidOtp) {
      return res.status(400).json({
        message: 'Invalid OTP.',
      });
    }

    // OTP verified successfully
    user.resetPasswordVerified = true;

    await user.save();

    return res.status(200).json({
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    console.error('VERIFY OTP ERROR:', error);

    return res.status(500).json({
      message: 'Server error while verifying OTP.',
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    console.log('========== RESET PASSWORD ==========');
    console.log('Request body:', {
      email: req.body.email,
      hasNewPassword: !!req.body.newPassword,
      hasConfirmPassword: !!req.body.confirmPassword,
    });

    const { email, newPassword, confirmPassword } = req.body;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!email) {
      return res.status(400).json({
        message: 'Email is required.',
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        message: 'New password is required.',
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        message: 'Confirm password is required.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // -----------------------------
    // FIND EMPLOYEE
    // -----------------------------

    const employee = await User.findOne({
      email: normalizedEmail,
      role: 'employee',
    }).select(
      '+password +resetPasswordVerified +resetPasswordOtp +resetPasswordOtpExpires',
    );

    if (!employee) {
      return res.status(404).json({
        message: 'Employee not found.',
      });
    }

    console.log('Employee found:', employee.name, employee.email);

    console.log('OTP verified:', employee.resetPasswordVerified);

    // -----------------------------
    // OTP VERIFICATION CHECK
    // -----------------------------

    if (employee.resetPasswordVerified !== true) {
      return res.status(403).json({
        message: 'Please verify the OTP before changing your password.',
      });
    }

    // -----------------------------
    // HASH PASSWORD
    // -----------------------------

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    employee.password = hashedPassword;

    employee.passwordChangedAt = new Date();

    employee.resetPasswordOtp = null;
    employee.resetPasswordOtpExpires = null;
    employee.resetPasswordVerified = false;

    // -----------------------------
    // SAVE PASSWORD
    // -----------------------------

    await employee.save();

    console.log('PASSWORD SAVED SUCCESSFULLY');

    // =================================================
    // ADMIN NOTIFICATION
    // =================================================

    try {
      console.log('Searching for admins...');

      const admins = await User.find({
        role: 'admin',
        isActive: true,
      }).select('_id name email');

      console.log('Admins found:', admins.length);

      if (admins.length > 0) {
        const notificationMessage = `Employee ${employee.name} has changed their password.`;

        const notifications = admins.map((admin) => ({
          recipient: admin._id,
          sender: employee._id,
          message: notificationMessage,
          type: 'password_changed',
          isRead: false,
        }));

        console.log('Saving notifications:', notifications);

        await Notification.insertMany(notifications);

        console.log('ADMIN NOTIFICATIONS SAVED');

        // -----------------------------
        // SOCKET NOTIFICATION
        // -----------------------------

        const io = req.app.get('io');

        if (io) {
          admins.forEach((admin) => {
            io.to(String(admin._id)).emit('newNotification', {
              message: notificationMessage,

              type: 'password_changed',

              isRead: false,

              createdAt: new Date(),

              sender: {
                _id: employee._id,
                name: employee.name,
                email: employee.email,
              },
            });
          });

          console.log('REAL-TIME ADMIN NOTIFICATION SENT');
        }
      } else {
        console.log('NO ACTIVE ADMIN FOUND');
      }
    } catch (notificationError) {
      // Do NOT fail password reset because
      // notification creation failed.
      console.error('NOTIFICATION ERROR:', notificationError);
    }

    // -----------------------------
    // SUCCESS
    // -----------------------------

    return res.status(200).json({
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('=================================');
    console.error('RESET PASSWORD ERROR:', error.message);
    console.error('STACK:', error.stack);
    console.error('=================================');

    return res.status(500).json({
      message: 'Unable to reset password.',
      error: error.message,
    });
  }
};

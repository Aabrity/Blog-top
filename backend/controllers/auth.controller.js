
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoSanitize from 'mongo-sanitize';
import nodemailer from 'nodemailer';
import validator from 'validator';

import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import { logActivity } from '../utils/loggers.js';
import { sanitizeEmailInput, sanitizeUsername } from '../utils/sanitize.js';
import { sendEmail } from '../utils/sendEmail.js';

const { isEmail } = validator;

const generateOTP = () => crypto.randomInt(100000, 999999).toString();
const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const isPasswordStrong = (password) => {
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;
  return strongPasswordRegex.test(password);
};

// Password expiry set to 90 days (adjust as needed)
const PASSWORD_EXPIRY_DAYS = 90;

const isPasswordExpired = (passwordChangedAt) => {
  if (!passwordChangedAt) return false; // or true if you want to force change on missing
  const expiryDate = new Date(passwordChangedAt);
  expiryDate.setDate(expiryDate.getDate() + PASSWORD_EXPIRY_DAYS);
  return expiryDate < new Date();
};

// ✅ SIGNUP
export const signup = async (req, res, next) => {
  try {
    const safeBody = mongoSanitize(req.body);
    let { username, email, password } = safeBody;

    if (!username || !email || !password)
      return next(errorHandler(400, 'Username, email and password are required'));

    email = email.trim().toLowerCase();
    username = sanitizeUsername(username);

    if (!isEmail(email)) return next(errorHandler(400, 'Invalid email format'));
    if (!isPasswordStrong(password))
      return next(errorHandler(400, 'Password must include upper, lower, number & symbol'));

    const existing = await User.findOne({ email });
    if (existing) return next(errorHandler(409, 'Email already in use'));

    const hashedPassword = await bcryptjs.hash(password, 10);
    const otp = generateOTP();
    const otpHashed = hashOTP(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
      otp: otpHashed,
      otpExpires,
      consentGivenAt: new Date(),
    });

    await newUser.save();
    await logActivity(newUser._id, 'User Registered', { email });

    await sendEmail(
      email,
      'Verify your email',
      `<p>Your OTP for verification is <b>${otp}</b>. It expires in 10 minutes.</p>`
    );

    res.status(201).json('Signup successful. Please verify your email.');
  } catch (error) {
    next(error);
  }
};

export const changeExpiredPassword = async (req, res, next) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword)
      return next(errorHandler(400, "All fields are required"));

    const user = await User.findOne({ email }).select("+password");
    if (!user) return next(errorHandler(404, "User not found"));

    const isOldMatch = await bcryptjs.compare(oldPassword, user.password);
    if (!isOldMatch)
      return next(errorHandler(401, "Old password is incorrect"));

    const isReuse = await bcryptjs.compare(newPassword, user.password);
    if (isReuse)
      return next(errorHandler(400, "New password cannot be same as old"));

    const hashedNewPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedNewPassword;
    user.passwordChangedAt = new Date();

    await user.save();

    await logActivity(user._id, "Password changed after expiry", { email });

    res.status(200).json({
      message: "Password changed successfully. You can now sign in.",
    });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const safeBody = mongoSanitize(req.body);
    let { email, password } = safeBody;

    if (!email || !password)
      return next(errorHandler(400, 'All fields are required'));

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select(
      '+password +otp +otpExpires +passwordChangedAt'
    );
    if (!user) return next(errorHandler(404, 'User not found'));

    if (!user.isVerified)
      return next(errorHandler(403, 'Verify your email first'));

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      await logActivity(user._id, 'Failed Login Attempt', { email });
      return next(errorHandler(400, 'Invalid credentials'));
    }

    // ✅ Password Expiry Check — DO NOT send OTP if expired
    const expiryDays = 90;
    const expiryTime = expiryDays * 24 * 60 * 60 * 1000;
    // const expiryTime = 10 * 1000;
    const passwordExpired =
      Date.now() - new Date(user.passwordChangedAt).getTime() > expiryTime;

    if (passwordExpired) {
      return res.status(403).json({
        message: 'Your password has expired. Please change it to continue.',
        passwordExpired: true,
        userId: user._id.toString(),
      });
    }

    // ✅ OTP Generation & Send (unchanged)
    const otp = generateOTP();
    const otpHashed = hashOTP(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otpHashed;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail(
      email,
      'Your Sign-In OTP',
      `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`
    );

    await logActivity(user._id, 'OTP Sent for Signin', { email });

    res.status(200).json({
      message: 'OTP sent to your email.',
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};


// VERIFY SIGNIN OTP
export const verifySigninOTP = async (req, res, next) => {
  try {
    const safeBody = mongoSanitize(req.body);
    const { userId, otp } = safeBody;

    if (!userId || !otp)
      return next(errorHandler(400, 'User ID and OTP are required'));

    const user = await User.findById(userId).select('+otp +otpExpires');

    if (!user) return next(errorHandler(404, 'User not found'));
    if (!user.otp || !user.otpExpires) return next(errorHandler(400, 'OTP not set'));
    if (user.otp !== hashOTP(otp)) return next(errorHandler(400, 'Invalid OTP'));
    if (user.otpExpires < Date.now()) return next(errorHandler(400, 'OTP expired'));

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    const { password, ...userData } = user._doc;

    await logActivity(user._id, 'User Logged In via OTP', { email: user.email });

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
      })
      .status(200)
      .json({ user: userData, token });
  } catch (error) {
    next(error);
  }
};

// ✅ EMAIL VERIFICATION
export const verifyEmail = async (req, res, next) => {
  try {
    const safeBody = mongoSanitize(req.body);
    let { email, otp } = safeBody;

    if (!email || !otp) return next(errorHandler(400, 'Email and OTP required'));

    email = email.trim().toLowerCase();
    otp = otp.trim();

    const user = await User.findOne({ email }).select('+otp +otpExpires');
    if (!user || user.otp !== hashOTP(otp) || user.otpExpires < Date.now())
      return next(errorHandler(400, 'Invalid or expired OTP'));

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    await logActivity(user._id, 'Email Verified', { email });

    res.status(200).json('Email verified successfully');
  } catch (error) {
    next(error);
  }
};

// ✅ REQUEST PASSWORD RESET
export const requestPasswordReset = async (req, res, next) => {
  try {
    const safeBody = mongoSanitize(req.body);
    let { email } = safeBody;

    if (!email || !isEmail(email)) return next(errorHandler(400, 'Valid email required'));
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(200)
        .json({ success: true, message: 'If this email exists, an OTP has been sent' });

    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOTP = hashedOtp;
    user.resetPasswordOTPExpiry = otpExpiry;
    await user.save();

    await sendEmail(email, 'Password Reset OTP', `<p>Your OTP is <b>${otp}</b></p>`);

    await logActivity(user._id, 'Password Reset Requested', { email });

    res.status(200).json({ success: true, message: 'If this email exists, an OTP has been sent' });
  } catch (error) {
    next(error);
  }
};

// ✅ RESET PASSWORD
export const resetPassword = async (req, res, next) => {
  try {
    const safeBody = mongoSanitize(req.body);
    let { email, otp, newPassword } = safeBody;

    if (!email || !otp || !newPassword)
      return next(errorHandler(400, 'All fields are required'));

    email = email.trim().toLowerCase();
    otp = otp.trim();

    if (!isPasswordStrong(newPassword))
      return next(errorHandler(400, 'Weak password'));

    const user = await User.findOne({ email }).select(
      '+resetPasswordOTP +resetPasswordOTPExpiry +password +oldPasswords'
    );
    if (!user) return next(errorHandler(400, 'Invalid or expired OTP'));

    const hashedOtpInput = hashOTP(otp);
    if (
      !user.resetPasswordOTP ||
      hashedOtpInput !== user.resetPasswordOTP ||
      user.resetPasswordOTPExpiry < Date.now()
    ) {
      return next(errorHandler(400, 'Invalid or expired OTP'));
    }

    for (const oldHashed of user.oldPasswords || []) {
      if (await bcryptjs.compare(newPassword, oldHashed)) {
        return next(errorHandler(400, 'You cannot reuse a recent password.'));
      }
    }

    const hashedNewPassword = await bcryptjs.hash(newPassword, 10);
    user.oldPasswords = [user.password, ...(user.oldPasswords || [])].slice(0, 5);
    user.password = hashedNewPassword;
    user.passwordChangedAt = new Date();
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;

    await user.save();

    await logActivity(user._id, 'Password Reset Successful', { email });

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// ✅ LOGOUT
export const logout = async (req, res, next) => {
  await logActivity(req.user?.id || 'Unknown', 'User Logged Out');
  res
    .clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    })
    .status(200)
    .json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    });
};

// ✅ GOOGLE AUTH
export const google = async (req, res, next) => {
  try {
    const safeBody = mongoSanitize(req.body);
    let { email, name } = safeBody;

    if (!email || !name)
      return next(errorHandler(400, 'Incomplete Google account data'));

    email = email.trim().toLowerCase();
    name = name.trim();

    const usernameBase = name.toLowerCase().replace(/\s/g, '');
    const username = `${usernameBase}_${Math.floor(Math.random() * 10000)}`;

    let user = await User.findOne({ email });
    if (!user) {
      const tempPass = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcryptjs.hash(tempPass, 10);

      user = new User({
        username,
        email,
        password: hashedPassword,
        isVerified: true,
        consentGivenAt: new Date(),
      });

      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    const {
      password,
      otp,
      otpExpires,
      resetPasswordOTP,
      resetPasswordOTPExpiry,
      ...userData
    } = user._doc;

    await logActivity(user._id, 'Google OAuth Sign In', { email });

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
      })
      .status(200)
      .json({ user: userData, token });
  } catch (error) {
    next(error);
  }
};

// ✅ CONTACT FORM
export const sendContactEmail = async (req, res, next) => {
  try {
    const safeBody = mongoSanitize(req.body);
    let { userEmail, subject, message } = safeBody;

    if (!userEmail || !subject || !message)
      return next(errorHandler(400, 'All fields are required'));
    if (!isEmail(userEmail)) return next(errorHandler(400, 'Invalid email'));

    subject = sanitizeEmailInput(subject);
    message = sanitizeEmailInput(message);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: userEmail,
      to: process.env.EMAIL_USER,
      subject: `Contact Form: ${subject}`,
      text: `From: ${userEmail}\n\n${message}`,
    });

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    next(error);
  }
};

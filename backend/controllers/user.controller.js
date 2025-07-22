
import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import validator from 'validator';
import User from '../models/user.model.js';
import { sendEmail } from '../utils/sendEmail.js';
import { errorHandler } from '../utils/error.js';
import { sanitizeString, sanitizeUsername } from '../utils/sanitize.js';
import sanitize from 'mongo-sanitize'; // <-- imported mongo-sanitize
const { isEmail } = validator;

// Utility: Validate ObjectId
const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/** Accepts http / https URLs */
const isHttpUrl = (str = '') => /^https?:\/\/.+/i.test(str);

/** Accepts a “data:image/…;base64,AAAA” string */
const isBase64Image = (str = '') =>
  /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/]+=*$/i.test(str);

export const test = (req, res) => {
  res.json({ message: 'API is working!' });
};

export const requestEmailChange = async (req, res, next) => {
  try {
    const { userId } = req.params;
    let { email } = req.body;

    email = sanitizeString(email);

    if (!validateObjectId(userId)) {
      return next(errorHandler(400, 'Invalid user ID'));
    }

    if (!isEmail(email)) {
      return next(errorHandler(400, 'Invalid email format'));
    }

    const newEmailLower = email.toLowerCase();

    // Check if email is already in use by another user
    const existingUser = await User.findOne({ email: newEmailLower });
    if (existingUser) {
      return next(errorHandler(400, 'Email is already in use'));
    }

    const user = await User.findById(userId).select('+email +emailChangeOTP +emailChangeOTPExpiry +emailChangeNewEmail');
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    if (newEmailLower === user.email.toLowerCase()) {
      return next(errorHandler(400, 'New email is the same as current email'));
    }

    // Generate 6-digit OTP
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    user.emailChangeOTP = otp;
    user.emailChangeOTPExpiry = otpExpiry;
    user.emailChangeNewEmail = newEmailLower;

    await user.save();

    // Notify current email about change request
    await sendEmail(
      user.email,
      'Email Change Requested',
      `
        <p>Hello ${user.username},</p>
        <p>We received a request to change the email on your account to <strong>${newEmailLower}</strong>.</p>
        <p>If you did not request this change, please contact support immediately.</p>
        <br/>
        <p>Regards,<br/>RatoFlag Security Team</p>
      `
    );

    // Send OTP to new email for confirmation
    await sendEmail(
      newEmailLower,
      'Confirm Your New Email',
      `
        <p>Hello,</p>
        <p>Please use the following OTP to confirm your new email address:</p>
        <h2>${otp}</h2>
        <p>This code expires in 10 minutes.</p>
        <br/>
        <p>Regards,<br/>RatoFlag Security Team</p>
      `
    );

    return res.status(200).json({
      message: 'Verification OTP sent to new email. Please confirm to complete the update.',
    });
  } catch (error) {
    next(error);
  }
};


// export const requestEmailChange = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
//     let { email } = req.body;

//     email = sanitizeString(email);

//     if (!validateObjectId(userId)) {
//       return next(errorHandler(400, 'Invalid user ID'));
//     }

//     if (!isEmail(email)) {
//       return next(errorHandler(400, 'Invalid email format'));
//     }

//     const user = await User.findById(userId).select('+email +emailChangeOTP +emailChangeOTPExpiry +emailChangeNewEmail');
//     if (!user) {
//       return next(errorHandler(404, 'User not found'));
//     }

//     const newEmailLower = email.toLowerCase();

//     if (newEmailLower === user.email.toLowerCase()) {
//       return next(errorHandler(400, 'New email is the same as current email'));
//     }

//     // Generate 6-digit OTP
//     const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
//     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

//     user.emailChangeOTP = otp;
//     user.emailChangeOTPExpiry = otpExpiry;
//     user.emailChangeNewEmail = newEmailLower;

//     await user.save();

//     // Notify current email about change request
//     await sendEmail(
//       user.email,
//       'Email Change Requested',
//       `
//         <p>Hello ${user.username},</p>
//         <p>We received a request to change the email on your account to <strong>${newEmailLower}</strong>.</p>
//         <p>If you did not request this change, please contact support immediately.</p>
//         <br/>
//         <p>Regards,<br/>RatoFlag Security Team</p>
//       `
//     );

//     // Send OTP to new email for confirmation
//     await sendEmail(
//       newEmailLower,
//       'Confirm Your New Email',
//       `
//         <p>Hello,</p>
//         <p>Please use the following OTP to confirm your new email address:</p>
//         <h2>${otp}</h2>
//         <p>This code expires in 10 minutes.</p>
//         <br/>
//         <p>Regards,<br/>RatoFlag Security Team</p>
//       `
//     );

//     return res.status(200).json({
//       message: 'Verification OTP sent to new email. Please confirm to complete the update.',
//     });
//   } catch (error) {
//     next(error);
//   }
// };


export const confirmEmailChange = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { otp } = req.body;

    if (!validateObjectId(userId)) {
      return next(errorHandler(400, 'Invalid user ID'));
    }

    if (!otp) {
      return next(errorHandler(400, 'OTP is required'));
    }

    const user = await User.findById(userId).select(
      '+email +emailChangeOTP +emailChangeOTPExpiry +emailChangeNewEmail'
    );

    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    if (!user.emailChangeOTP || !user.emailChangeOTPExpiry || !user.emailChangeNewEmail) {
      return next(errorHandler(400, 'No pending email change request'));
    }

    if (new Date() > user.emailChangeOTPExpiry) {
      return next(errorHandler(400, 'OTP expired. Please request email change again.'));
    }

    if (otp !== user.emailChangeOTP) {
      return next(errorHandler(400, 'Invalid OTP'));
    }

    const oldEmail = user.email;
    user.email = user.emailChangeNewEmail;

    // Clear OTP fields
    user.emailChangeOTP = undefined;
    user.emailChangeOTPExpiry = undefined;
    user.emailChangeNewEmail = undefined;

    await user.save();

    // Confirmation email to new email
    await sendEmail(
      user.email,
      'Email Successfully Changed',
      `
      <p>Hello ${user.username},</p>
      <p>Your email has been successfully updated to this address.</p>
      <br/>
      <p>Regards,<br/>RatoFlag Security Team</p>
      `
    );

    // Notification to old email
    await sendEmail(
      oldEmail,
      'Your Email Address Was Changed',
      `
      <p>Hello ${user.username},</p>
      <p>Your account email was recently changed from this address to <strong>${user.email}</strong>.</p>
      <p>If you did not perform this change, please contact support immediately.</p>
      <br/>
      <p>Regards,<br/>RatoFlag Security Team</p>
      `
    );

    res.status(200).json({ message: 'Email updated successfully.' });
  } catch (error) {
    next(error);
  }
};


export const updateUser = async (req, res, next) => {
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);

  if (!validateObjectId(req.params.userId)) {
    return next(errorHandler(400, 'Invalid user ID'));
  }

  if (req.user.id !== req.params.userId && !req.user.isAdmin) {
    return next(errorHandler(403, 'You are not allowed to update this user'));
  }

  try {
    // Fetch user with password and oldPasswords for reuse checks
    const user = await User.findById(req.params.userId).select('+password +oldPasswords');
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    const updates = {};

    /** 🔐 PASSWORD UPDATE */
    if (req.body.password) {
      const currentPassword = req.body.currentPassword;
      if (!currentPassword) {
        return next(errorHandler(400, 'Current password is required to change password'));
      }

      const isMatch = await bcryptjs.compare(currentPassword, user.password);
      if (!isMatch) {
        return next(errorHandler(403, 'Incorrect current password'));
      }

      // Password strength validation
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
      if (!strongPasswordRegex.test(req.body.password)) {
        return next(
          errorHandler(
            400,
            'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
          )
        );
      }

      // Prevent reuse: check new password against oldPasswords
      for (const oldHash of user.oldPasswords || []) {
        if (await bcryptjs.compare(req.body.password, oldHash)) {
          return next(errorHandler(400, 'You cannot reuse a recent password.'));
        }
      }

      // Hash new password
      const newHashed = await bcryptjs.hash(req.body.password, 12);
      updates.password = newHashed;

      // Update oldPasswords array with current password hash, max 5 stored
      user.oldPasswords = [user.password, ...(user.oldPasswords || [])].slice(0, 5);
      updates.oldPasswords = user.oldPasswords;

      updates.passwordChangedAt = new Date();

      // Send confirmation email (optional)
      await sendEmail(
        user.email,
        'Your password has been changed',
        `
          <h2>Password Change Confirmation</h2>
          <p>Hello ${user.username},</p>
          <p>Your password was successfully changed on ${new Date().toLocaleString()}.</p>
          <p>If you did not perform this action, please <strong>reset your password immediately</strong> or contact support.</p>
          <br/>
          <p>Regards,<br/>RatoFlag Security Team</p>
        `
      );
    }

    /** 🧼 USERNAME UPDATE */
    if (req.body.username) {
      const username = sanitizeUsername(req.body.username);
      if (username.length < 7 || username.length > 20) {
        return next(errorHandler(400, 'Username must be between 7 and 20 characters'));
      }
      updates.username = username;
    }

    // Do NOT update email here to avoid immediate email change without confirmation

    // Apply all updates atomically (password and username only)
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updates },
      { new: true }
    );

    if (!updatedUser) {
      return next(errorHandler(404, 'User not found'));
    }

    // Remove sensitive fields before response
    const {
      password,
      otp,
      otpExpires,
      resetPasswordOTP,
      resetPasswordOTPExpiry,
      oldPasswords,
      emailChangeOTP,
      emailChangeOTPExpiry,
      emailChangeNewEmail,
      ...safeUser
    } = updatedUser._doc;

    res.status(200).json(safeUser);
  } catch (error) {
    next(error);
  }
};
export const deleteUser = async (req, res, next) => {
  // Sanitize inputs
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);
  req.query = sanitize(req.query);

  if (!validateObjectId(req.params.userId)) {
    return next(errorHandler(400, 'Invalid user ID'));
  }

  if (!req.user.isAdmin && req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'You are not allowed to delete this user'));
  }

  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }
    res.status(200).json({ message: 'User has been deleted' });
  } catch (error) {
    next(error);
  }
};

export const signout = (req, res, next) => {
  try {
    res
      .clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
      })
      .status(200)
      .json({ message: 'User has been signed out' });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  // Sanitize inputs
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);
  req.query = sanitize(req.query);

  if (!req.user.isAdmin) {
    return next(errorHandler(403, 'You are not allowed to see all users'));
  }

  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = Math.min(parseInt(req.query.limit) || 9, 50); // limit max page size
    const sortDirection = req.query.sort === 'asc' ? 1 : -1;

    const users = await User.find()
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit);

    const usersWithoutSensitive = users.map((user) => {
      const {
        password,
        otp,
        otpExpires,
        resetPasswordOTP,
        resetPasswordOTPExpiry,
        ...rest
      } = user._doc;
      return rest;
    });

    const totalUsers = await User.countDocuments();

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      users: usersWithoutSensitive,
      totalUsers,
      lastMonthUsers,
    });
  } catch (error) {
    next(error);
  }
};

// Separate endpoint for profile picture upload
import fs from 'fs';
import path from 'path';

export const updateUserProfilePicture = async (req, res, next) => {
  // Sanitize inputs (only req.params needed here)
  req.params = sanitize(req.params);

  if (!req.file) {
    return next(errorHandler(400, 'No file uploaded'));
  }

  if (!validateObjectId(req.params.userId)) {
    return next(errorHandler(400, 'Invalid user ID'));
  }

  if (req.user.id.toString() !== req.params.userId.toString() && !req.user.isAdmin) {
    return next(errorHandler(403, 'Not authorized to update this user'));
  }

  try {
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path); // Delete invalid file
      return next(errorHandler(400, 'Invalid image format'));
    }

    // ✅ Only save the filename (not 'uploads/')
    const filenameOnly = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { profilePicture: filenameOnly },
      { new: true }
    );

    if (!updatedUser) {
      fs.unlinkSync(req.file.path);
      return next(errorHandler(404, 'User not found'));
    }

    const { password, otp, otpExpires, resetPasswordOTP, resetPasswordOTPExpiry, ...rest } = updatedUser._doc;

    res.status(200).json({
      message: 'Profile picture updated successfully',
      user: rest,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPublicInfo = async (req, res) => {
  // Sanitize input
  req.params = sanitize(req.params);

  try {
    const user = await User.findById(req.params.userId).select('username profilePicture');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUser = async (req, res, next) => {
  // Sanitize input
  req.params = sanitize(req.params);

  if (!validateObjectId(req.params.userId)) {
    return next(errorHandler(400, 'Invalid user ID'));
  }

  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    const { password, otp, otpExpires, resetPasswordOTP, resetPasswordOTPExpiry, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

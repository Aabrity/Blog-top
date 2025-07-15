
import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import validator from 'validator';
import User from '../models/user.model.js';
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

export const updateUser = async (req, res, next) => {
  // Sanitize inputs
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);
  req.query = sanitize(req.query);

  if (!validateObjectId(req.params.userId)) {
    return next(errorHandler(400, 'Invalid user ID'));
  }

  if (req.user.id !== req.params.userId && !req.user.isAdmin) {
    return next(errorHandler(403, 'You are not allowed to update this user'));
  }

  try {
    const updates = {};
    const user = await User.findById(req.params.userId).select('+password +oldPasswords');
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    // ✅ Password update (with reuse prevention)
    if (req.body.password) {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
      if (!strongPasswordRegex.test(req.body.password)) {
        return next(
          errorHandler(
            400,
            'Password must be minimum 8 characters, with uppercase, lowercase, number, and special character'
          )
        );
      }

      // 🔒 Check against old passwords
      for (const oldHash of user.oldPasswords || []) {
        const reused = await bcryptjs.compare(req.body.password, oldHash);
        if (reused) {
          return next(errorHandler(400, 'You cannot reuse a recent password.'));
        }
      }

      // 🔐 Hash and update password
      const newHashed = await bcryptjs.hash(req.body.password, 12);
      updates.password = newHashed;

      // ⏳ Track previous passwords and password change time
      user.oldPasswords = [user.password, ...(user.oldPasswords || [])].slice(0, 5);
      updates.oldPasswords = user.oldPasswords;
      updates.passwordChangedAt = new Date();
    }

    // 🧼 Username update
    if (req.body.username) {
      const username = sanitizeUsername(req.body.username);
      if (username.length < 7 || username.length > 20) {
        return next(errorHandler(400, 'Username must be between 7 and 20 characters'));
      }
      updates.username = username;
    }

    // 🧼 Email update
    if (req.body.email) {
      const email = sanitizeString(req.body.email);
      if (!isEmail(email)) {
        return next(errorHandler(400, 'Invalid email format'));
      }
      updates.email = email.toLowerCase();
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updates },
      { new: true }
    );

    if (!updatedUser) {
      return next(errorHandler(404, 'User not found'));
    }

    // Clean up sensitive fields before sending back
    const { password, otp, otpExpires, resetPasswordOTP, resetPasswordOTPExpiry, oldPasswords, ...rest } =
      updatedUser._doc;

    res.status(200).json(rest);
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

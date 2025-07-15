
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import validator from 'validator';
import Post from './post.model.js';
import Comment from './comment.model.js'; 

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric (with underscores)'],
      index: true, // for faster lookup
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: 'Please provide a valid email address',
      },
      index: true, // for faster lookup
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // do not return password by default
    },
    profilePicture: {
      type: String,
      default:
        'person.png', // default profile picture if none is uploaded
    },
    isAdmin: {
      type: Boolean,
      default: false,
      immutable: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    resetPasswordOTP: {
      type: String,
      select: false,
    },
    resetPasswordOTPExpiry: {
      type: Number,
      select: false,
    },
       oldPasswords: {
      type: [String],
      default: [],
      select: false, // do not expose this by default
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.pre('findOneAndDelete', async function (next) {
  try {
    const user = await this.model.findOne(this.getFilter());
    if (user) {
      await Post.deleteMany({ userId: user._id });
      await Comment.deleteMany({ userId: user._id });
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password on login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;


import mongoose from 'mongoose';

const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
      validate: {
        validator: mongoose.Types.ObjectId.isValid,
        message: 'Invalid post ID.',
      },
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      validate: {
        validator: mongoose.Types.ObjectId.isValid,
        message: 'Invalid reporter ID.',
      },
    },
    reason: {
      type: String,
      enum: ['Spam', 'Abusive Content', 'False Information', 'Other'],
      required: true,
    },
    comment: {
      type: String,
      maxlength: 500,
      trim: true,
      validate: {
        validator: function (v) {
          return !/<script.*?>.*?<\/script>/gi.test(v);
        },
        message: 'Comment contains disallowed content.',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate reports by same user on same post
reportSchema.index({ postId: 1, reporterId: 1 }, { unique: true });

export default mongoose.model('Report', reportSchema);

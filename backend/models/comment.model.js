
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
      validate: {
        validator: function (v) {
          // Avoid XSS by rejecting script tags etc.
          return !/<script.*?>.*?<\/script>/gi.test(v);
        },
        message: 'Malicious script content is not allowed.',
      },
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
      validate: {
        validator: function (arr) {
          return arr.every(id => mongoose.Types.ObjectId.isValid(id));
        },
        message: 'Invalid user ID in likes array.',
      },
    },
    numberOfLikes: {
      type: Number,
      default: 0,
      min: 0,
      max: 100000, // Sanity limit
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 1000, // Prevent abuse
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Optional virtual for like count (auditable)
commentSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

// Pre-save hook to prevent likes and numberOfLikes mismatch
commentSchema.pre('save', function (next) {
  this.numberOfLikes = this.likes.length;
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;

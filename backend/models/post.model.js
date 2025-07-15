import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import uniqueValidator from 'mongoose-unique-validator';

const { Schema } = mongoose;

// simple but strict URL regex
const URL_REGEX = /^(https?|ipfs):\/\/[^\s/$.?#].[^\s]*$/i;

const postSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,         
    },

    /* ─── PUBLIC FACING FIELDS ─────────────────────────────────────────── */
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 140,
      unique: true,        
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/, 
      index: true,
    },
    content: {
      type: String,
      required: true,
      // Last‑line defence against stored‑XSS
      set: (v) =>
        sanitizeHtml(v, {
          allowedTags: sanitizeHtml.defaults.allowedTags,
          allowedAttributes: false,
        }),
    },

    /* ─── META ─────────────────────────────────────────────────────────── */
     images: {
      type: String,
      default: [
        'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png',
      ],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    //   immutable: true,      // can’t flip after creation
    },
    category: {
      type: String,
      enum: ['Suspicious & Criminal Activity', 'Lost & Found', 'Accidents & Public Hazards','uncategorized'],
      default: 'uncategorized',
    //   lowercase: true,
      index: true,
    },
    flag: {
      type: String,
      enum: ['redflag',  'greenflag'],
      default: 'redflag',
    },

    /* ─── LOCATION ─────────────────────────────────────────────────────── */
    location: {
      type: String,
      default: 'kathmandu',
      trim: true,
    },
    geolocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true, versionKey: false }
);

/* ─── INDEXES & PLUGINS ────────────────────────────────────────────────── */

postSchema.plugin(uniqueValidator, {
  message: '{PATH} already exists.',
});

export default mongoose.model('Post', postSchema);


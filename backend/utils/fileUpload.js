// import crypto from 'crypto';
// import multer from 'multer';
// import path from 'path';

// // Storage config - files stored in 'uploads' folder (outside web root if possible)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/'); // Ensure this folder exists and is not publicly accessible
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     // Generate a random safe filename
//     const randomName = crypto.randomBytes(16).toString('hex') + ext;
//     cb(null, randomName);
//   },
// });

// // Accept only image mime types
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'));
//   }
// };

// // 2 MB file size limit
// export const upload = multer({
//   storage,
//   limits: { fileSize: 2 * 1024 * 1024 },
//   fileFilter,
// });
import fs from 'fs';
import multer from 'multer';
import path from 'path';

// Create uploads folder if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // ✅ path relative to project root
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});


export function saveBase64Image(base64String, userId) {
  try {
    const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid base64 image format');

    const ext = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    const filename = `image_${Date.now()}_${userId}.${ext}`;
    const filePath = path.join( 'uploads', filename);

    // Ensure folder exists, write file synchronously or async await
    fs.writeFileSync(filePath, buffer);

    // Return URL path relative to server root or full URL if you want
    return `${filename}`;
  } catch (error) {
    console.error('Failed to save image:', error);
    throw error;
  }
}

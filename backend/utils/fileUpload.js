
import fs from 'fs';
import multer from 'multer';
import path from 'path';

// Create uploads folder if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
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

    // const filename = `image_${Date.now()}_${userId}.${ext}`;
    const safeExt = ext.replace(/[^a-z]/gi, '');
    const filename = `user-${userId}-${Date.now()}.${safeExt}`;

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

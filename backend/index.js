import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import fs from 'fs';
import helmet from 'helmet';
import http from 'http';
import https from 'https';
import mongoose from 'mongoose';
import path from 'path';
import xssClean from 'xss-clean';


dotenv.config();

const __dirname = path.resolve();
const app = express();

// ====== Enable trust proxy if behind a reverse proxy (nginx, Heroku, etc) ======
app.set('trust proxy', 1);


// ====== Database Connection ======
mongoose
  .connect(process.env.MONGO, {
    autoIndex: false, // Prevents index creation DoS
  })
  .then(() => {
    console.log('✅ MongoDB connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ====== Security Headers & Middleware ======
app.use(helmet());

// CSP Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://*'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// Custom headers
app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Input sanitization
app.use(mongoSanitize());
app.use(xssClean());

// Parse cookies and JSON
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// CORS (adjust origin for deployment)
app.use(
  cors({
    origin: 'https://localhost', // 🔁 CHANGE THIS in production to your frontend domain
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ====== Health Check (Optional) ======
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'OK' });
});
// ====== Global Error Handler ======
app.use((err, req, res, next) => {
  console.error('❗', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || 'Internal Server Error',
  });
});

// ====== Static Files (SPA front-end build) ======
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '/blog-top/dist')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'blog-top', 'dist', 'index.html'));
// });





// ====== HTTPS Setup ======
const sslOptions = {
  key: fs.readFileSync('server.key'), // replace with your cert key path
  cert: fs.readFileSync('server.cert'), // replace with your cert path
};

// Start HTTPS server
https.createServer(sslOptions, app).listen(443, () => {
  console.log('🚀 HTTPS Server running on port 443');
});

// Redirect all HTTP to HTTPS
// http
//   .createServer((req, res) => {
//     res.writeHead(301, {
//       Location: `https://${req.headers.host}${req.url}`,
//     });
//     res.end();
//   })
//   .listen(80, () => {
//     console.log('🔄 HTTP Server redirecting all traffic to HTTPS');
//   });

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import xssClean from 'xss-clean';
import adminLogsRoute from './routes/admin.routes.js';
import authRoutes from './routes/auth.route.js';
import commentRoutes from './routes/comment.route.js';
import postRoutes from './routes/post.route.js';
import reportRoutes from './routes/report.route.js';
import userRoutes from './routes/user.route.js';

dotenv.config();

const __dirname = path.resolve();
const app = express();

// ====== Enable trust proxy if behind a reverse proxy (nginx, Heroku, etc) ======
app.set('trust proxy', 1);

// ====== Force HTTPS middleware ======
app.use((req, res, next) => {
  if (!req.secure) {
    // Redirect to HTTPS
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// ====== Database Connection ======
mongoose
  .connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
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

// API rate limiting (generic)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', apiLimiter);

// ====== Routes ======
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/admin', adminLogsRoute);

// ====== Static Files (SPA front-end build) ======
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '/blog-top/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'blog-top', 'dist', 'index.html'));
});

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
http
  .createServer((req, res) => {
    res.writeHead(301, {
      Location: `https://${req.headers.host}${req.url}`,
    });
    res.end();
  })
  .listen(80, () => {
    console.log('🔄 HTTP Server redirecting all traffic to HTTPS');
  });

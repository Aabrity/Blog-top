
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import helmet from 'helmet';
import http from 'http';
import https from 'https';
import mongoose from 'mongoose';
import path from 'path';
import xssClean from 'xss-clean';
import adminLogsRoute from './routes/admin.routes.js';
import authRoutes from './routes/auth.route.js';
import commentRoutes from './routes/comment.route.js';
import postRoutes from './routes/post.route.js';
import reportRoutes from './routes/report.route.js';
import userRoutes from './routes/user.route.js';
import csrf from 'csurf';
import session from 'express-session';
// import paymentRoutes from '../routes/payment.routes.js'; 
import paymentRoutes from "./routes/payment.routes.js"
dotenv.config();

const __dirname = path.resolve();
const app = express();

// ===== Enable trust proxy if behind a reverse proxy (nginx, Heroku, etc) =====
app.set('trust proxy', 1);

// ===== CORS: Allow frontend origin to send cookies =====
app.use(
  cors({
    origin: 'https://localhost', // CHANGE THIS in production to your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ===== Parse cookies =====
app.use(cookieParser());

// ===== Session middleware (needed for CSRF and captcha session storage) =====
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard_cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true if HTTPS
      sameSite: 'Strict',
      httpOnly: true,
    },
  })
);

// ===== Parse JSON bodies =====
app.use(express.json({ limit: '10mb' }));

// ===== CSRF Protection =====
// const csrfProtection = csrf({
//   cookie: false, // We store the CSRF secret in the session (default)
// });
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in prod
    sameSite: 'Strict',
  },
});
app.use(csrfProtection);

// ===== Provide CSRF token to frontend =====

app.get('/api/csrf-token', (req, res) => {
  try {
    const token = req.csrfToken();
    // console.log('Generated CSRF token:', token);
    res.json({ csrfToken: token });
  } catch (error) {
    console.error('CSRF token error:', error);
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
});

// ===== Force HTTPS redirect middleware =====
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// ===== Database Connection =====
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

// ===== Security Headers & Middleware =====
app.use(helmet());

// Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://*'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);


// Custom security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Input sanitization
app.use(mongoSanitize());
app.use(xssClean());

// ===== API rate limiting (generic) =====
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', apiLimiter);

// ===== Routes =====
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/admin', adminLogsRoute);
app.use('/api/payment', paymentRoutes);

// ===== Static Files (SPA frontend build) =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '/blog-top/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'blog-top', 'dist', 'index.html'));
});

// ===== Health Check =====
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error('❗', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || 'Internal Server Error',
  });
});

// ===== HTTPS Setup =====
const sslOptions = {
  key: fs.readFileSync('server.key'), // Replace with your cert key path
  cert: fs.readFileSync('server.cert'), // Replace with your cert path
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

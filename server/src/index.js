/**
 * src/index.js — Express server entry point
 */
import 'dotenv/config';
import express        from 'express';
import helmet         from 'helmet';
import cors           from 'cors';
import cookieParser   from 'cookie-parser';
import morgan         from 'morgan';
import path           from 'path';
import { fileURLToPath } from 'url';
import { doubleCsrf } from 'csrf-csrf';

import assessmentRouter from './routes/assessment.js';
import authRouter       from './routes/auth.js';
import adminRouter      from './routes/admin.js';
import { apiLimiter }   from './middleware/rateLimiter.js';
import pool             from './db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com', 'https://connect.facebook.net'],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:', 'https://www.facebook.com'],
      connectSrc: [
        "'self'",
        'https://*.razorpay.com',
        'https://www.facebook.com',
        'https://api.web3forms.com',
        'https://script.google.com',
        'https://api.advancedlifecoaching.in',
      ],
      frameSrc:      ['https://*.razorpay.com', 'https://expansioncode.tejaldesae.com'],
      frameAncestors: ["'self'"],
      baseUri:       ["'self'"],
      formAction:    ["'self'", 'https://api.web3forms.com'],
      objectSrc:     ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (same-origin, Postman, curl)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Body parsing + cookies ────────────────────────────────────────
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(cookieParser());

// ── Request logging ───────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Trust proxy (for correct req.ip behind Nginx/Railway/Render) ─
app.set('trust proxy', 1);

// ── CSRF protection ───────────────────────────────────────────────
// Fail loudly rather than silently shipping a publicly-known secret.
if (process.env.NODE_ENV === 'production' && !process.env.CSRF_SECRET) {
  throw new Error('CSRF_SECRET must be set in production.');
}

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret:    () => process.env.CSRF_SECRET || 'dev-csrf-secret-change-me',
  cookieName:   '__Host-psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size:         64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// Expose CSRF token endpoint (fetch before any state-changing request)
app.get('/api/csrf-token', (req, res) => {
  res.json({ token: generateToken(req, res) });
});

// Apply CSRF protection to all state-changing API routes
// (exempts GET/HEAD/OPTIONS automatically)
app.use('/api', doubleCsrfProtection);

// ── General rate limit ────────────────────────────────────────────
// MUST be registered BEFORE the routers. Express runs middleware in
// order; mounted after, the routers answer first and this never runs.
app.use('/api', apiLimiter);

// ── API routes ────────────────────────────────────────────────────
app.use('/api/assessment', assessmentRouter);
app.use('/api/auth',       authRouter);
app.use('/api/admin',      adminRouter);

// ── Never serve server internals, VCS data or dependencies ───────
// The static root below is the whole project, which contains /server.
// Without this guard, /server/src/db/pool.js (and friends) are public.
const BLOCKED_PATHS = /^\/(server|\.git|\.vercel|node_modules|design-system|docs|text)(\/|$)/i;
app.use((req, res, next) => {
  if (BLOCKED_PATHS.test(req.path)) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

// ── Serve main website (static files from project root) ─────────
const siteRoot = path.join(__dirname, '..', '..'); // project root (one level above /server)
app.use(express.static(siteRoot, { index: 'index.html', dotfiles: 'deny' }));

// ── Serve admin dashboard SPA ────────────────────────────────────
// The admin dashboard lives at /admin (HTML file served from server/public/admin)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(publicDir, 'admin', 'index.html'));
});
app.get('/admin/*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'admin', 'index.html'));
});

// ── Health check ──────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', db: 'connected', env: process.env.NODE_ENV });
  } catch {
    return res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[server error]', err.message);
  const status = err.status || err.statusCode || 500;
  const msg    = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred.'
    : err.message;
  res.status(status).json({ error: msg });
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  Tejal Desae server running on port ${PORT}`);
  console.log(`   ENV:    ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Admin:  http://localhost:${PORT}/admin\n`);
});

export default app;

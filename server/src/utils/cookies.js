const COOKIE_NAME = 'token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const isProd = () => process.env.NODE_ENV === 'production';

// In production the client (Vercel) and API (Render) live on different sites,
// so the cookie must be SameSite=None; Secure to be sent cross-site.
const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd() ? 'none' : 'lax',
  path: '/',
});

module.exports = { COOKIE_NAME, MAX_AGE_MS, cookieOptions };

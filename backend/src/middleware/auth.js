import { verifyToken } from '../utils/jwt.js';
import { query } from '../db/pool.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      return res.status(401).json({ detail: 'Потрібна авторизація' });
    }
    const payload = verifyToken(token);
    const { rows } = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role_id, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
      [payload.sub]
    );
    if (!rows[0]) {
      return res.status(401).json({ detail: 'Користувача не знайдено' });
    }
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ detail: 'Недійсний або прострочений токен' });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = verifyToken(token);
    query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role_id, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
      [payload.sub]
    ).then(({ rows }) => {
      req.user = rows[0] || null;
      next();
    }).catch(() => {
      req.user = null;
      next();
    });
  } catch {
    req.user = null;
    next();
  }
}

export function requireManager(req, res, next) {
  if (!req.user || req.user.role_name !== 'Керівник') {
    return res.status(403).json({ detail: 'Доступ лише для керівника системи' });
  }
  next();
}

export function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: (Number(process.env.JWT_EXPIRES_MIN) || 1440) * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie('access_token');
}

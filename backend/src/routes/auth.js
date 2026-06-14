import { Router } from 'express';
import { query } from '../db/pool.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';
import { setAuthCookie, clearAuthCookie, requireAuth } from '../middleware/auth.js';
import { writeAudit } from '../middleware/audit.js';

const router = Router();
const MAX_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCK_MINUTES = Number(process.env.LOCK_MINUTES) || 15;

function validatePassword(password) {
  if (!password || password.length < 8) return 'Пароль має містити щонайменше 8 символів';
  if (!/[A-Z]/.test(password)) return 'Пароль має містити велику літеру';
  if (!/[a-z]/.test(password)) return 'Пароль має містити малу літеру';
  if (!/[0-9]/.test(password)) return 'Пароль має містити цифру';
  return null;
}

router.post('/reg', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, username } = req.body;
    const fn = first_name || username || 'Користувач';
    const ln = last_name || '';
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email та пароль обовʼязкові' });
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) return res.status(400).json({ detail: pwdErr });

    const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows[0]) {
      return res.status(400).json({ detail: 'Користувач з таким email вже існує' });
    }

    const hash = await hashPassword(password);
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id)
       VALUES ($1, $2, $3, $4, $5, 1) RETURNING id, email, first_name, last_name, phone, role_id`,
      [email.toLowerCase(), hash, fn, ln, phone || null]
    );
    const user = rows[0];
    const token = signToken({ sub: user.id, role: user.role_id });
    setAuthCookie(res, token);
    await writeAudit(user.id, 'register', 'user', user.id, {});
    res.status(201).json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role_id: user.role_id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ detail: 'Помилка реєстрації' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: 'Введіть email та пароль' });
    }

    const { rows } = await query(
      `SELECT u.*, r.name AS role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = $1`,
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ detail: 'Невірний email або пароль' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ detail: 'Обліковий запис тимчасово заблоковано. Спробуйте пізніше.' });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await query(
          `UPDATE users SET failed_login_attempts = $1, locked_until = NOW() + ($2 || ' minutes')::INTERVAL WHERE id = $3`,
          [attempts, String(LOCK_MINUTES), user.id]
        );
        return res.status(423).json({ detail: 'Забагато невдалих спроб. Спробуйте пізніше.' });
      }
      await query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [attempts, user.id]);
      return res.status(401).json({ detail: 'Невірний email або пароль' });
    }

    await query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id]);
    const token = signToken({ sub: user.id, role: user.role_id });
    setAuthCookie(res, token);
    await writeAudit(user.id, 'login', 'user', user.id, {});

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role_id: user.role_id,
      role_name: user.role_name,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ detail: 'Помилка входу' });
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    first_name: req.user.first_name,
    last_name: req.user.last_name,
    phone: req.user.phone,
    role_id: req.user.role_id,
    role_name: req.user.role_name,
  });
});

export default router;

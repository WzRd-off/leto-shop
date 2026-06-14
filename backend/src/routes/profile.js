import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { writeAudit } from '../middleware/audit.js';
import { normalizeCardNumber, validateCardPayload } from '../utils/cardValidation.js';

const router = Router();

function validatePassword(password) {
  if (!password || password.length < 8) return 'Пароль має містити щонайменше 8 символів';
  if (!/[A-Z]/.test(password)) return 'Пароль має містити велику літеру';
  if (!/[a-z]/.test(password)) return 'Пароль має містити малу літеру';
  if (!/[0-9]/.test(password)) return 'Пароль має містити цифру';
  return null;
}

const CARD_SELECT = 'id, card_type, last_four, exp_month, exp_year, is_default, created_at';

router.use(requireAuth);

router.get('/my_profile', async (req, res) => {
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

router.put('/update_profile', async (req, res) => {
  try {
    const { first_name, last_name, phone, email } = req.body;
    const { rows } = await query(
      `UPDATE users SET
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         phone = COALESCE($3, phone),
         email = COALESCE($4, email)
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, role_id`,
      [first_name, last_name, phone, email?.toLowerCase(), req.user.id]
    );
    await writeAudit(req.user.id, 'profile_update', 'user', req.user.id, {});
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ detail: 'Email вже зайнятий' });
    res.status(500).json({ detail: 'Помилка оновлення' });
  }
});

router.put('/change-password', async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const pwdErr = validatePassword(new_password);
    if (pwdErr) return res.status(400).json({ detail: pwdErr });

    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const ok = await verifyPassword(old_password, rows[0].password_hash);
    if (!ok) return res.status(400).json({ detail: 'Невірний поточний пароль' });

    const hash = await hashPassword(new_password);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    await writeAudit(req.user.id, 'password_change', 'user', req.user.id, {});
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ detail: 'Помилка зміни пароля' });
  }
});

router.get('/payment-methods', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT ${CARD_SELECT} FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, id`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ detail: 'Помилка завантаження карток' });
  }
});

router.post('/payment-methods', async (req, res) => {
  try {
    const { card_type, card_number, exp_month, exp_year, cvv, is_default } = req.body;
    const err = validateCardPayload({ card_type, card_number, exp_month, exp_year, cvv });
    if (err) return res.status(400).json({ detail: err });

    const digits = normalizeCardNumber(card_number);
    const lastFour = digits.slice(-4);

    if (is_default) {
      await query('UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1', [req.user.id]);
    }

    const { rows } = await query(
      `INSERT INTO payment_methods (user_id, card_type, last_four, exp_month, exp_year, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${CARD_SELECT}`,
      [req.user.id, card_type, lastFour, Number(exp_month), Number(exp_year), Boolean(is_default)]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ detail: 'Помилка збереження картки' });
  }
});

router.delete('/payment-methods/:id', async (req, res) => {
  await query('DELETE FROM payment_methods WHERE id = $1 AND user_id = $2', [
    Number(req.params.id),
    req.user.id,
  ]);
  res.status(204).send();
});

export default router;

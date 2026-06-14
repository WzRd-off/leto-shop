import { Router } from 'express';
import { query } from '../db/pool.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/:productId', optionalAuth, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { content, author_name, is_anonymous } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ detail: 'Введіть текст коментаря' });
    }

    const prod = await query('SELECT id FROM products WHERE id = $1', [productId]);
    if (!prod.rows[0]) return res.status(404).json({ detail: 'Товар не знайдено' });

    let userId = null;
    let authorName = (author_name || '').trim();
    let anonymous = Boolean(is_anonymous);

    if (req.user && !anonymous) {
      userId = req.user.id;
      authorName = `${req.user.first_name} ${req.user.last_name}`.trim();
      anonymous = false;
    } else {
      anonymous = true;
      userId = null;
      if (!authorName) authorName = 'Гість';
    }

    const { rows } = await query(
      `INSERT INTO product_comments (product_id, user_id, author_name, content, is_anonymous)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, author_name, content, is_anonymous, created_at`,
      [productId, userId, authorName, content.trim(), anonymous]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ detail: 'Не вдалося додати коментар' });
  }
});

export default router;

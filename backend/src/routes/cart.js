import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

async function getCartRows(userId) {
  const { rows } = await query(
    `SELECT ci.id, ci.product_id, ci.quantity, ci.updated_at,
            p.name, p.price, p.image_url, p.stock_quantity, p.sku
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1 AND p.is_active = TRUE
     ORDER BY ci.updated_at DESC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    quantity: r.quantity,
    name: r.name,
    price: Number(r.price),
    image_url: r.image_url,
    stock_quantity: r.stock_quantity,
    sku: r.sku,
    line_total: Number(r.price) * r.quantity,
  }));
}

router.get('/', async (req, res) => {
  try {
    const items = await getCartRows(req.user.id);
    const total = items.reduce((s, i) => s + i.line_total, 0);
    res.json({ items, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ detail: 'Помилка кошика' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const pid = Number(product_id);
    const qty = Math.max(1, Number(quantity));

    const prod = await query('SELECT id, stock_quantity FROM products WHERE id = $1 AND is_active = TRUE', [pid]);
    if (!prod.rows[0]) return res.status(404).json({ detail: 'Товар не знайдено' });

    await query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = LEAST(cart_items.quantity + $3, $4), updated_at = NOW()`,
      [req.user.id, pid, qty, prod.rows[0].stock_quantity]
    );

    const items = await getCartRows(req.user.id);
    res.json({ items, total: items.reduce((s, i) => s + i.line_total, 0) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ detail: 'Не вдалося додати до кошика' });
  }
});

router.patch('/:productId', async (req, res) => {
  try {
    const pid = Number(req.params.productId);
    const qty = Math.max(1, Number(req.body.quantity));

    const prod = await query('SELECT stock_quantity FROM products WHERE id = $1', [pid]);
    if (!prod.rows[0]) return res.status(404).json({ detail: 'Товар не знайдено' });

    const result = await query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW()
       WHERE user_id = $2 AND product_id = $3 RETURNING id`,
      [Math.min(qty, prod.rows[0].stock_quantity), req.user.id, pid]
    );
    if (!result.rowCount) return res.status(404).json({ detail: 'Позицію не знайдено' });

    const items = await getCartRows(req.user.id);
    res.json({ items, total: items.reduce((s, i) => s + i.line_total, 0) });
  } catch (e) {
    res.status(500).json({ detail: 'Помилка оновлення' });
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    await query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [
      req.user.id,
      Number(req.params.productId),
    ]);
    const items = await getCartRows(req.user.id);
    res.json({ items, total: items.reduce((s, i) => s + i.line_total, 0) });
  } catch (e) {
    res.status(500).json({ detail: 'Помилка' });
  }
});

router.delete('/', async (req, res) => {
  try {
    await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    res.json({ items: [], total: 0 });
  } catch (e) {
    res.status(500).json({ detail: 'Помилка' });
  }
});

export default router;

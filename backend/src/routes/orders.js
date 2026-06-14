import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/my_orders', requireAuth, async (req, res) => {
  try {
    const { rows: orders } = await query(
      `SELECT o.id, o.total_amount, o.created_at, o.paid_at, o.closed_at,
              os.id AS status_id, os.name AS status_name
       FROM orders o
       JOIN order_statuses os ON os.id = o.status_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    const result = [];
    for (const o of orders) {
      const items = await query(
        `SELECT oi.quantity, oi.unit_price, p.name, p.image_url, p.sku
         FROM order_items oi JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1`,
        [o.id]
      );
      result.push({ ...o, items: items.rows });
    }
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ detail: 'Помилка' });
  }
});

export default router;

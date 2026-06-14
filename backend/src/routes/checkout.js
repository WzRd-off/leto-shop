import { Router } from 'express';
import { pool, query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { writeAudit } from '../middleware/audit.js';
import { processPayment } from '../services/payment.js';

const router = Router();
const MIN_ORDER = 350;

router.use(requireAuth);

router.post('/pay', async (req, res) => {
  const client = await pool.connect();
  try {
    const { payment_method_id } = req.body;
    const userId = req.user.id;

    const cartResult = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock_quantity, p.name
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1 AND p.is_active = TRUE`,
      [userId]
    );
    const cart = cartResult.rows;
    if (!cart.length) {
      return res.status(400).json({ detail: 'Кошик порожній' });
    }

    const total = cart.reduce((s, r) => s + Number(r.price) * r.quantity, 0);
    if (total < MIN_ORDER) {
      return res.status(400).json({ detail: `Мінімальна сума замовлення — ${MIN_ORDER} грн` });
    }

    for (const item of cart) {
      if (item.quantity > item.stock_quantity) {
        return res.status(400).json({
          detail: `Недостатньо товару «${item.name}» на складі`,
        });
      }
    }

    let pmId = payment_method_id ? Number(payment_method_id) : null;
    if (pmId) {
      const pm = await client.query(
        'SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2',
        [pmId, userId]
      );
      if (!pm.rows[0]) {
        return res.status(400).json({ detail: 'Платіжний засіб не знайдено' });
      }
    } else {
      const def = await client.query(
        'SELECT id FROM payment_methods WHERE user_id = $1 AND is_default = TRUE LIMIT 1',
        [userId]
      );
      pmId = def.rows[0]?.id || null;
    }

    const paymentResult = processPayment({ amount: total, userId });
    if (!paymentResult.success) {
      return res.status(402).json({ detail: 'Оплата не пройшла' });
    }

    await client.query('BEGIN');

    const orderInsert = await client.query(
      `INSERT INTO orders (user_id, status_id, total_amount, payment_method_id, paid_at)
       VALUES ($1, 1, $2, $3, NOW()) RETURNING id`,
      [userId, total, pmId]
    );
    const orderId = orderInsert.rows[0].id;

    for (const item of cart) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
      const stockUpdate = await client.query(
        `UPDATE products SET stock_quantity = stock_quantity - $1
         WHERE id = $2 AND stock_quantity >= $1 RETURNING id`,
        [item.quantity, item.product_id]
      );
      if (!stockUpdate.rowCount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ detail: `Недостатньо товару «${item.name}» на складі` });
      }
    }

    await client.query(
      `INSERT INTO payments (order_id, amount, status, external_ref) VALUES ($1, $2, 'success', $3)`,
      [orderId, total, paymentResult.externalRef]
    );

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    await client.query('COMMIT');

    await writeAudit(userId, 'checkout', 'order', orderId, { total, externalRef: paymentResult.externalRef });

    res.status(201).json({
      success: true,
      message: 'Успішно сплачено',
      order_id: orderId,
      total_amount: total,
    });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(e);
    res.status(500).json({ detail: 'Помилка оформлення замовлення' });
  } finally {
    client.release();
  }
});

export default router;

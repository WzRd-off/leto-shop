import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../db/pool.js';
import { requireAuth, requireManager } from '../middleware/auth.js';
import { writeAudit } from '../middleware/audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname) || '.jpg');
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();
router.use(requireAuth, requireManager);

// Products CRUD
router.get('/products', async (_req, res) => {
  const { rows } = await query(
    `SELECT id, sku, name, description, price, stock_quantity, category, characteristics, image_url, is_active
     FROM products ORDER BY id`
  );
  res.json(rows);
});

router.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { sku, name, description, price, stock_quantity, category, characteristics } = req.body;
    let chars = characteristics;
    if (typeof chars === 'string') {
      try { chars = JSON.parse(chars); } catch { chars = {}; }
    }
    const imageUrl = req.file ? `/images/${req.file.filename}` : req.body.image_url || null;

    const { rows } = await query(
      `INSERT INTO products (sku, name, description, price, stock_quantity, category, characteristics, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        sku,
        name,
        description || null,
        Number(price),
        Number(stock_quantity) || 0,
        category || null,
        JSON.stringify(chars || {}),
        imageUrl,
      ]
    );
    await writeAudit(req.user.id, 'product_create', 'product', rows[0].id, {});
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ detail: 'SKU вже існує' });
    console.error(e);
    res.status(500).json({ detail: 'Помилка створення' });
  }
});

router.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { sku, name, description, price, stock_quantity, category, characteristics, is_active } = req.body;
    let chars = characteristics;
    if (typeof chars === 'string') {
      try { chars = JSON.parse(chars); } catch { chars = undefined; }
    }
    const imageUrl = req.file ? `/images/${req.file.filename}` : undefined;

    const { rows } = await query(
      `UPDATE products SET
         sku = COALESCE($1, sku),
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         price = COALESCE($4, price),
         stock_quantity = COALESCE($5, stock_quantity),
         category = COALESCE($6, category),
         characteristics = COALESCE($7::jsonb, characteristics),
         image_url = COALESCE($8, image_url),
         is_active = COALESCE($9, is_active)
       WHERE id = $10 RETURNING *`,
      [
        sku,
        name,
        description,
        price != null ? Number(price) : null,
        stock_quantity != null ? Number(stock_quantity) : null,
        category,
        chars != null ? JSON.stringify(chars) : null,
        imageUrl,
        is_active != null ? is_active === 'true' || is_active === true : null,
        id,
      ]
    );
    if (!rows[0]) return res.status(404).json({ detail: 'Не знайдено' });
    await writeAudit(req.user.id, 'product_update', 'product', id, {});
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ detail: 'Помилка оновлення' });
  }
});

router.delete('/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  await query('UPDATE products SET is_active = FALSE WHERE id = $1', [id]);
  await writeAudit(req.user.id, 'product_delete', 'product', id, {});
  res.status(204).send();
});

// Categories CRUD
router.get('/categories', async (_req, res) => {
  const { rows } = await query(
    `SELECT id, name, description, sort_order FROM categories ORDER BY sort_order, name`
  );
  res.json(rows);
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ detail: 'Назва обовʼязкова' });
    const { rows } = await query(
      `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *`,
      [name.trim(), description?.trim() || null]
    );
    await writeAudit(req.user.id, 'category_create', 'category', rows[0].id, {});
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ detail: 'Категорія вже існує' });
    res.status(500).json({ detail: 'Помилка створення' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const cat = await query('SELECT name FROM categories WHERE id = $1', [id]);
    if (!cat.rows[0]) return res.status(404).json({ detail: 'Не знайдено' });

    const used = await query(
      'SELECT COUNT(*)::int AS cnt FROM products WHERE category = $1 AND is_active = TRUE',
      [cat.rows[0].name]
    );
    if (used.rows[0].cnt > 0) {
      return res.status(400).json({ detail: 'Категорія містить товари — спочатку перемістіть їх' });
    }

    await query('DELETE FROM categories WHERE id = $1', [id]);
    await writeAudit(req.user.id, 'category_delete', 'category', id, {});
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ detail: 'Помилка видалення' });
  }
});

// Orders
router.get('/orders', async (_req, res) => {
  const { rows: orders } = await query(
    `SELECT o.id, o.user_id, o.total_amount, o.created_at, o.paid_at, o.closed_at,
            os.id AS status_id, os.name AS status_name,
            u.first_name, u.last_name, u.email, u.phone
     FROM orders o
     JOIN order_statuses os ON os.id = o.status_id
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );

  const result = [];
  for (const o of orders) {
    const items = await query(
      `SELECT oi.quantity, oi.unit_price, p.name, p.sku, p.id AS product_id
       FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1`,
      [o.id]
    );
    const pm = await query(
      `SELECT pm.card_type, pm.last_four, pm.exp_month, pm.exp_year FROM payment_methods pm
       JOIN orders ord ON ord.payment_method_id = pm.id WHERE ord.id = $1`,
      [o.id]
    );
    result.push({
      ...o,
      payer_name: `${o.first_name} ${o.last_name}`.trim(),
      items: items.rows,
      payment_method: pm.rows[0] || null,
    });
  }
  res.json(result);
});

router.get('/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await query(
    `SELECT o.*, os.name AS status_name, u.first_name, u.last_name, u.email, u.phone
     FROM orders o
     JOIN order_statuses os ON os.id = o.status_id
     JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ detail: 'Замовлення не знайдено' });
  const items = await query(
    `SELECT oi.*, p.name, p.sku FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1`,
    [id]
  );
  res.json({ ...rows[0], items: items.rows });
});

router.patch('/orders/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const { status_id } = req.body;
  const { rows } = await query(
    `UPDATE orders SET status_id = $1 WHERE id = $2 RETURNING id, status_id`,
    [status_id, id]
  );
  if (!rows[0]) return res.status(404).json({ detail: 'Не знайдено' });
  await writeAudit(req.user.id, 'order_status_change', 'order', id, { status_id });
  res.json(rows[0]);
});

router.post('/orders/:id/close', async (req, res) => {
  const id = Number(req.params.id);
  const closedStatus = await query(`SELECT id FROM order_statuses WHERE name = 'Закрито'`);
  const statusId = closedStatus.rows[0]?.id || 5;
  const { rows } = await query(
    `UPDATE orders SET status_id = $1, closed_at = NOW() WHERE id = $2 RETURNING *`,
    [statusId, id]
  );
  if (!rows[0]) return res.status(404).json({ detail: 'Не знайдено' });
  await writeAudit(req.user.id, 'order_close', 'order', id, {});
  res.json(rows[0]);
});

router.patch('/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { status_id } = req.body;
  if (!status_id) return res.status(400).json({ detail: 'Вкажіть status_id' });
  const { rows } = await query(
    `UPDATE orders SET status_id = $1 WHERE id = $2 RETURNING id, status_id`,
    [status_id, id]
  );
  if (!rows[0]) return res.status(404).json({ detail: 'Не знайдено' });
  await writeAudit(req.user.id, 'order_status_change', 'order', id, { status_id });
  res.json(rows[0]);
});

export default router;

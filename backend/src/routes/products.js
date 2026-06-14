import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

function buildProductQuery(filters, sort) {
  const conditions = ['p.is_active = TRUE'];
  const params = [];
  let i = 1;

  if (filters.category) {
    conditions.push(`p.category = $${i++}`);
    params.push(filters.category);
  }
  if (filters.priceMin != null && filters.priceMin !== '') {
    conditions.push(`p.price >= $${i++}`);
    params.push(Number(filters.priceMin));
  }
  if (filters.priceMax != null && filters.priceMax !== '') {
    conditions.push(`p.price <= $${i++}`);
    params.push(Number(filters.priceMax));
  }
  if (filters.search) {
    conditions.push(`(p.name ILIKE $${i} OR p.description ILIKE $${i} OR p.sku ILIKE $${i})`);
    params.push(`%${filters.search}%`);
    i++;
  }

  let orderBy = 'p.id ASC';
  switch (sort) {
    case 'price_asc':
      orderBy = 'p.price ASC';
      break;
    case 'price_desc':
      orderBy = 'p.price DESC';
      break;
    case 'name_asc':
      orderBy = 'p.name ASC';
      break;
    case 'name_desc':
      orderBy = 'p.name DESC';
      break;
    default:
      orderBy = 'p.id ASC';
  }

  const sql = `
    SELECT p.id, p.sku, p.name, p.description, p.price, p.stock_quantity,
           p.category, p.characteristics, p.image_url
    FROM products p
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
  `;
  return { sql, params };
}

router.get('/featured', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, sku, name, description, price, stock_quantity, category, characteristics, image_url
       FROM products WHERE is_active = TRUE ORDER BY id LIMIT 6`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ detail: 'Помилка завантаження товарів' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { sql, params } = buildProductQuery(
      {
        category: req.query.category,
        priceMin: req.query.priceMin,
        priceMax: req.query.priceMax,
        search: req.query.search,
      },
      req.query.sort
    );
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ detail: 'Помилка каталогу' });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, description FROM categories ORDER BY sort_order, name`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ detail: 'Помилка' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await query(
      `SELECT id, sku, name, description, price, stock_quantity, category, characteristics, image_url
       FROM products WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ detail: 'Товар не знайдено' });

    const images = await query(
      `SELECT id, url, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order`,
      [id]
    );
    const comments = await query(
      `SELECT id, author_name, content, is_anonymous, created_at,
              CASE WHEN user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_registered
       FROM product_comments WHERE product_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      ...rows[0],
      images: images.rows.length ? images.rows : [{ url: rows[0].image_url, sort_order: 0 }],
      comments: comments.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ detail: 'Помилка' });
  }
});

export default router;

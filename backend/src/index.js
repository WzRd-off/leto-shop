import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import cartRouter from './routes/cart.js';
import checkoutRouter from './routes/checkout.js';
import profileRouter from './routes/profile.js';
import ordersRouter from './routes/orders.js';
import commentsRouter from './routes/comments.js';
import managerRouter from './routes/manager.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use('/images', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/cart', cartRouter);
app.use('/checkout', checkoutRouter);
app.use('/profile', profileRouter);
app.use('/orders', ordersRouter);
app.use('/comments/products', commentsRouter);
app.use('/manager', managerRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  const detail = process.env.NODE_ENV === 'production' ? 'Внутрішня помилка сервера' : err.message;
  res.status(500).json({ detail });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

//Тест: client@flora.ua / director@flora.ua + Test123!
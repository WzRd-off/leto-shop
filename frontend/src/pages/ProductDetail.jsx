import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Icons } from '../constants/Icons';
import { productsAPI, cartAPI, commentsAPI } from '../services/api';
import { API_BASE_URL } from '../services/config';
import { useAuth } from '../hooks/useAuth';
import { parseCharacteristics, groupCharacteristics } from '../utils/productHelpers';
import { categoryToSlug } from '../constants/appConstants';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [commentError, setCommentError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await productsAPI.getById(id);
      setProduct(data);
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setAdding(true);
    try {
      await cartAPI.add(product.id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    setCommentError('');
    try {
      await commentsAPI.add(id, {
        content: commentText,
        author_name: authorName,
        is_anonymous: anonymous || !isAuthenticated,
      });
      setCommentText('');
      await load();
    } catch (err) {
      setCommentError(err.message);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="co-spinner-wrap" style={{ minHeight: 300 }}><div className="co-spinner" /></div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="co-empty"><p>Товар не знайдено</p><Link to="/catalog">До каталогу</Link></div>
        <Footer />
      </>
    );
  }

  const { care, params } = parseCharacteristics(product.characteristics);
  const charGroups = groupCharacteristics(params);
  const img = product.images?.[0]?.url || product.image_url;
  const inStock = product.stock_quantity > 0;

  return (
    <>
      <Header />
      <div className="pd-page">
        <div className="pd-container">
          <nav className="pd-breadcrumb">
            <Link to="/">Головна</Link>
            <span>/</span>
            <Link to="/catalog">Каталог</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link to={`/catalog/${categoryToSlug(product.category)}`}>{product.category}</Link>
              </>
            )}
            <span>/</span>
            <span>{product.name}</span>
          </nav>

          <div className="pd-layout">
            <div className="pd-gallery">
              {img ? (
                <img src={`${API_BASE_URL}${img}`} alt={product.name} className="pd-image" />
              ) : (
                <div className="pd-image-placeholder">
                  {Icons.imagePlaceholder}
                  <span>Немає фото</span>
                </div>
              )}
            </div>

            <div className="pd-info">
              {product.category && (
                <span className="pd-category">{product.category}</span>
              )}
              <h1 className="pd-title">{product.name}</h1>
              <p className="pd-sku">Артикул: {product.sku}</p>

              <div className="pd-price-row">
                <span className="pd-price">{Number(product.price).toLocaleString('uk-UA')} ₴</span>
                <span className={`pd-stock${inStock ? ' pd-stock--ok' : ''}`}>
                  {inStock ? '✓ В наявності' : 'Немає в наявності'}
                </span>
              </div>

              <div className="pd-qty-row">
                <span className="pd-qty-label">Кількість</span>
                <div className="pd-qty-controls">
                  <button type="button" className="pd-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <span className="pd-qty-value">{qty}</span>
                  <button
                    type="button"
                    className="pd-qty-btn"
                    onClick={() => setQty((q) => Math.min(product.stock_quantity, q + 1))}
                    disabled={!inStock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className={`pd-cart-btn${added ? ' pd-cart-btn--added' : ''}`}
                onClick={handleAddToCart}
                disabled={!inStock || adding}
              >
                {added ? Icons.check : Icons.cart}
                {adding ? 'Додаємо...' : added ? 'Додано до кошика' : 'Додати до кошика'}
              </button>

              {product.description && (
                <section className="pd-section">
                  <h2 className="pd-section__title">Опис</h2>
                  <p className="pd-description">{product.description}</p>
                </section>
              )}
            </div>
          </div>

          {care && (
            <section className="pd-care-full">
              <h2 className="pd-care-full__title">{Icons.leaf} Догляд</h2>
              <p className="pd-care-full__text">{care}</p>
            </section>
          )}

          {charGroups.length > 0 && (
            <section className="pd-chars">
              <div className="pd-chars__layout">
                <h2 className="pd-chars__heading">Характеристики</h2>
                <div className="pd-chars__content">
                  {charGroups.map((group) => (
                    <div key={group.title} className="pd-chars__group">
                      <h3 className="pd-chars__group-title">{group.title}</h3>
                      {group.items.map(([label, value]) => (
                        <div key={label} className="pd-char-row">
                          <span className="pd-char-row__label">{label}</span>
                          <span className="pd-char-row__dots" aria-hidden="true" />
                          <span className="pd-char-row__value">{value}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="pd-comments">
            <h2 className="pd-comments__title">Коментарі</h2>
            <form onSubmit={handleComment} className="pd-comment-form">
              {!isAuthenticated && (
                <div className="pd-comment-form__guest">
                  <input
                    className="input"
                    placeholder="Ваше ім'я (для анонімного відгуку)"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                  />
                  <label className="text-body">
                    <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                    {' '}Надіслати анонімно
                  </label>
                </div>
              )}
              <textarea
                className="input"
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ваш коментар..."
                required
              />
              {commentError && <div className="error-box">{commentError}</div>}
              <button type="submit" className="btn-sm">Додати коментар</button>
            </form>

            <div className="pd-comment-list">
              {product.comments?.length ? product.comments.map((c) => (
                <div key={c.id} className="pd-comment">
                  <div className="pd-comment__header">
                    <strong>{c.author_name}</strong>
                    {c.is_anonymous && <span className="pd-comment__anon">анонімно</span>}
                    <time>{new Date(c.created_at).toLocaleDateString('uk-UA')}</time>
                  </div>
                  <p>{c.content}</p>
                </div>
              )) : (
                <p className="text-body">Коментарів ще немає. Будьте першим!</p>
              )}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}

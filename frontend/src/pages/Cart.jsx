import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { cartAPI } from '../services/api';
import { API_BASE_URL } from '../services/config';
import { MIN_ORDER_UAH } from '../constants/appConstants';

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [removed, setRemoved] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await cartAPI.get();
      setCart(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateQty = async (productId, quantity) => {
    if (quantity < 1) {
      const item = cart.items.find((i) => i.product_id === productId);
      if (item) await removeItem(item);
      return;
    }
    const data = await cartAPI.update(productId, quantity);
    setCart(data);
  };

  const removeItem = async (item) => {
    setRemoved(item);
    await cartAPI.remove(item.product_id);
    const data = await cartAPI.get();
    setCart(data);
  };

  const restoreItem = async () => {
    if (!removed) return;
    await cartAPI.add(removed.product_id, removed.quantity);
    setRemoved(null);
    await load();
  };

  const canCheckout = cart.total >= MIN_ORDER_UAH;

  return (
    <>
      <Header />
      <div className="co-container" style={{ padding: '40px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h1 className="h2" style={{ textAlign: 'left' }}>Кошик</h1>

        {loading ? (
          <div className="co-spinner-wrap"><div className="co-spinner" /></div>
        ) : cart.items.length === 0 && !removed ? (
          <div className="co-empty">
            <p>Кошик порожній</p>
            <Link to="/catalog" className="btn-filled">До покупок</Link>
          </div>
        ) : (
          <>
            {removed && (
              <div className="error-box" style={{ background: '#FFF3E0', color: '#E65100' }}>
                Товар вилучений.{' '}
                <button type="button" className="btn-sm" onClick={restoreItem}>Відновити</button>
              </div>
            )}

            {cart.items.map((item) => (
              <div key={item.product_id} className="order-item" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {item.image_url && (
                  <img
                    src={`${API_BASE_URL}${item.image_url}`}
                    alt=""
                    style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <strong>{item.name}</strong>
                  <p className="text-body">{Number(item.price).toLocaleString('uk-UA')} ₴ × {item.quantity}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" className="btn-outline" onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button type="button" className="btn-outline" onClick={() => updateQty(item.product_id, item.quantity + 1)}>+</button>
                </div>
                <button type="button" className="btn-outline" onClick={() => removeItem(item)}>Вилучити</button>
              </div>
            ))}

            <p className="h3" style={{ marginTop: 24 }}>
              Разом: {Number(cart.total).toLocaleString('uk-UA')} ₴
            </p>

            {!canCheckout && cart.items.length > 0 && (
              <p style={{ color: 'var(--error-red)' }}>
                Мінімальна сума замовлення — {MIN_ORDER_UAH} грн
              </p>
            )}

            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              {canCheckout ? (
                <button type="button" className="btn-filled" onClick={() => navigate('/checkout')}>
                  Оформити замовлення
                </button>
              ) : (
                <Link to="/catalog" className="btn-filled">До покупок</Link>
              )}
              <button type="button" className="btn-outline" onClick={() => cartAPI.clear().then(load)}>
                Очистити кошик
              </button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

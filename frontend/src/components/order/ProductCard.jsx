import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants/Icons';
import { API_BASE_URL } from '../../services/config';
import { useAuth } from '../../hooks/useAuth';
import { cartAPI } from '../../services/api';

export default function ProductCard({ product }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleBuy = () => {
    navigate(`/products/${product.id}`);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setAdding(true);
    try {
      await cartAPI.add(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      alert(e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="sc-card">
      <div className="sc-image-wrap" onClick={handleBuy} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleBuy()}>
        {product.image_url ? (
          <img src={`${API_BASE_URL}${product.image_url}`} alt={product.name} className="sc-image" />
        ) : (
          <div className="sc-image-placeholder">
            {Icons.imagePlaceholder}
            <span className="sc-image-placeholder__label">Немає фото</span>
          </div>
        )}
        <div className="sc-price-badge">
          {Number(product.price).toLocaleString('uk-UA')} ₴
        </div>
      </div>

      <div className="sc-body">
        <h3 className="sc-title" onClick={handleBuy} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleBuy()}>
          {product.name}
        </h3>
        <p className="sc-sku">Артикул: {product.sku}</p>

        <div className="sc-actions">
          <button type="button" className="sc-buy-btn" onClick={handleBuy}>
            Купити
          </button>
          <button
            type="button"
            className={`sc-cart-btn${added ? ' sc-cart-btn--added' : ''}`}
            onClick={handleAddToCart}
            disabled={adding}
            title={added ? 'Додано до кошика' : 'Додати до кошика'}
            aria-label="Додати до кошика"
          >
            {added ? Icons.check : Icons.cart}
          </button>
        </div>
      </div>
    </div>
  );
}

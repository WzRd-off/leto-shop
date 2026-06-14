import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Spinner, EmptyState, StatusBadge } from './CommonComponents';
import { ordersAPI } from '../../services/api';

export function HistoryTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ordersAPI.getMyOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setError('Не вдалося завантажити замовлення'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="card">
      <h2 className="card-title">Історія замовлень</h2>
      {error && <div className="error-box">{error}</div>}

      {orders.length === 0 ? (
        <EmptyState
          icon="📋"
          text="У вас ще немає замовлень."
          action={<Link to="/catalog" className="btn-sm">До каталогу</Link>}
        />
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-item">
              <div className="order-info">
                <p className="order-title">
                  Замовлення #{order.id} — {Number(order.total_amount).toLocaleString('uk-UA')} ₴
                </p>
                <div className="order-meta">
                  <span className="order-detail">
                    📅 {new Date(order.created_at).toLocaleDateString('uk-UA')}
                  </span>
                  {order.items?.map((it) => (
                    <span key={it.name} className="order-detail">
                      {it.name} × {it.quantity}
                    </span>
                  ))}
                </div>
              </div>
              <div className="order-status-col">
                <StatusBadge status={order.status_name ?? order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

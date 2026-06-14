import React, { useState, useEffect, useCallback } from 'react';
import { STATUS_LIST } from '../../constants/appConstants';
import { Spinner, EmptyState, StatusBadge } from './shared';
import { managerAPI } from '../../services/api';

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchName, setSearchName] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await managerAPI.getOrders();
      setOrders(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setError('Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = orders.filter((o) => {
    if (filterStatus && String(o.status_id) !== filterStatus) return false;
    if (searchName.trim()) {
      const q = searchName.trim().toLowerCase();
      const name = (o.payer_name || '').toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  const patchStatus = async (id, status_id) => {
    setSaving(true);
    try {
      await managerAPI.updateOrderStatus(id, { status_id });
      await fetchAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const closeOrder = async (id) => {
    setSaving(true);
    try {
      await managerAPI.closeOrder(id);
      await fetchAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mgr-section">
      <div className="mgr-section__header">
        <h2 className="mgr-page-title">Замовлення</h2>
        <input
          className="mgr-input"
          placeholder="Пошук за ім'ям..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <select
          className="mgr-input mgr-input--select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Всі статуси</option>
          {STATUS_LIST.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="mgr-error-box">{error}</div>}

      {loading ? (
        <Spinner />
      ) : !filtered.length ? (
        <EmptyState text="Замовлень не знайдено." />
      ) : (
        <div className="mgr-orders-list">
          {filtered.map((order) => (
            <div key={order.id} className="mgr-order-card">
              <div className="mgr-order-card__content">
                <div className="mgr-order-card__header">
                  <span className="mgr-order-card__title">
                    #{order.id} — {order.payer_name || order.email}
                  </span>
                  <StatusBadge status={order.status_name} />
                </div>
                <p className="text-body">
                  {Number(order.total_amount).toLocaleString('uk-UA')} ₴ ·{' '}
                  {new Date(order.created_at).toLocaleString('uk-UA')}
                </p>
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  {expandedId === order.id ? 'Згорнути' : 'Деталі'}
                </button>

                {expandedId === order.id && (
                  <div style={{ marginTop: 12 }}>
                    <p><strong>Платник:</strong> {order.email} {order.phone}</p>
                    <ul>
                      {order.items?.map((it) => (
                        <li key={it.product_id}>{it.name} × {it.quantity} — {it.unit_price} ₴</li>
                      ))}
                    </ul>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      <select
                        className="mgr-input"
                        value={order.status_id}
                        onChange={(e) => patchStatus(order.id, Number(e.target.value))}
                        disabled={saving}
                      >
                        {STATUS_LIST.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {order.status_name !== 'Закрито' && (
                        <button
                          type="button"
                          className="mgr-button mgr-button--primary"
                          onClick={() => closeOrder(order.id)}
                          disabled={saving}
                        >
                          Закрити замовлення
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

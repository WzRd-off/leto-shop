import React from 'react';
import { Link } from 'react-router-dom';

export default function SuccessScreen({
  onReset,
  title = 'Замовлення прийнято!',
  message = "Ваше замовлення успішно відправлено. Менеджер зв'яжеться з вами найближчим часом.",
}) {
  return (
    <div className="ss-overlay">
      <div className="ss-card">
        <div className="ss-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="var(--primary-green)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="ss-title">{title}</h2>
        <p className="ss-text">{message}</p>
        <div className="ss-actions">
          <Link to="/profile" className="ss-btn-primary">
            Перейти до замовлень
          </Link>
          {onReset && (
            <button type="button" className="ss-btn-secondary" onClick={onReset}>
              Продовжити
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

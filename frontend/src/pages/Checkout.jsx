import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SuccessScreen from '../components/order/SuccessScreen';
import CardForm from '../components/profile/CardForm';
import { cartAPI, checkoutAPI, profileAPI } from '../services/api';
import { formatCardDisplay } from '../constants/appConstants';
import { EMPTY_CARD_FORM, normalizeCardNumber, validateCardForm } from '../utils/cardHelpers';

export default function CheckoutPage() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [methods, setMethods] = useState([]);
  const [selectedPm, setSelectedPm] = useState('');
  const [newPm, setNewPm] = useState(EMPTY_CARD_FORM);
  const [showAddCard, setShowAddCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [c, pm] = await Promise.all([cartAPI.get(), profileAPI.getPaymentMethods()]);
        setCart(c);
        setMethods(pm);
        const def = pm.find((m) => m.is_default);
        setSelectedPm(def ? String(def.id) : pm[0] ? String(pm[0].id) : '');
        if (!c.items?.length) navigate('/cart');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const addPaymentMethod = async () => {
    setError('');
    const validationErr = validateCardForm(newPm);
    if (validationErr) {
      setError(validationErr);
      return;
    }
    setAddingCard(true);
    try {
      const created = await profileAPI.addPaymentMethod({
        card_type: newPm.card_type,
        card_number: normalizeCardNumber(newPm.card_number),
        exp_month: Number(newPm.exp_month),
        exp_year: Number(newPm.exp_year),
        cvv: newPm.cvv,
        is_default: methods.length === 0,
      });
      setMethods((m) => [...m, created]);
      setSelectedPm(String(created.id));
      setNewPm(EMPTY_CARD_FORM);
      setShowAddCard(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setAddingCard(false);
    }
  };

  const handlePay = async () => {
    if (!selectedPm && methods.length === 0) {
      setError('Додайте платіжну картку');
      return;
    }
    setPaying(true);
    setError('');
    try {
      await checkoutAPI.pay(selectedPm ? Number(selectedPm) : null);
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setPaying(false);
    }
  };

  if (success) {
    return (
      <>
        <Header />
        <SuccessScreen
          title="Успішно сплачено!"
          message="Ваше замовлення зафіксовано. Дякуємо за покупку!"
          onReset={() => navigate('/profile')}
        />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="co-container checkout-page">
        <Link to="/cart" className="text-body">← Повернутись до кошика</Link>
        <h1 className="h2 checkout-page__title">Оплата</h1>

        {loading ? (
          <div className="co-spinner-wrap"><div className="co-spinner" /></div>
        ) : (
          <>
            <p className="h3">Сума до сплати: {Number(cart.total).toLocaleString('uk-UA')} ₴</p>

            <div className="card checkout-card">
              <h3 className="h3">Спосіб розрахунку</h3>

              {methods.length > 0 ? (
                <div className="checkout-card__list">
                  {methods.map((m) => (
                    <label key={m.id} className={`checkout-card__option${selectedPm === String(m.id) ? ' checkout-card__option--active' : ''}`}>
                      <input
                        type="radio"
                        name="pm"
                        value={m.id}
                        checked={selectedPm === String(m.id)}
                        onChange={() => setSelectedPm(String(m.id))}
                      />
                      <span className={`card-list__badge card-list__badge--${m.card_type}`}>
                        {m.card_type === 'mastercard' ? 'MC' : 'VISA'}
                      </span>
                      <span>{formatCardDisplay(m)}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-body">У вас ще немає збережених карток.</p>
              )}

              <div className="checkout-card__add">
                {!showAddCard ? (
                  <button type="button" className="btn-outline" onClick={() => setShowAddCard(true)}>
                    + Додати нову картку
                  </button>
                ) : (
                  <>
                    <h4 className="card-form-wrap__title">Нова картка</h4>
                    <CardForm form={newPm} onChange={setNewPm} idPrefix="checkout" />
                    <div className="card-form-wrap__actions">
                      <button type="button" className="btn-sm" onClick={addPaymentMethod} disabled={addingCard}>
                        {addingCard ? 'Збереження...' : 'Зберегти картку'}
                      </button>
                      <button type="button" className="btn-outline" onClick={() => { setShowAddCard(false); setNewPm(EMPTY_CARD_FORM); }}>
                        Скасувати
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {error && <div className="error-box" style={{ marginTop: 16 }}>{error}</div>}

            <button
              type="button"
              className="btn-filled checkout-page__pay"
              onClick={handlePay}
              disabled={paying || (!selectedPm && methods.length === 0)}
            >
              {paying ? 'Оплата...' : 'Оплатити'}
            </button>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

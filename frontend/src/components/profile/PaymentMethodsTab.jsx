import React, { useState, useEffect } from 'react';
import { profileAPI } from '../../services/api';
import { formatCardDisplay } from '../../constants/appConstants';
import { EMPTY_CARD_FORM, normalizeCardNumber, validateCardForm } from '../../utils/cardHelpers';
import CardForm from './CardForm';
import { Spinner } from './CommonComponents';

export function PaymentMethodsTab() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_CARD_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    profileAPI.getPaymentMethods()
      .then((data) => setMethods(Array.isArray(data) ? data : []))
      .catch(() => setError('Не вдалося завантажити'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setError('');
    const validationErr = validateCardForm(form);
    if (validationErr) {
      setError(validationErr);
      return;
    }
    setSaving(true);
    try {
      await profileAPI.addPaymentMethod({
        card_type: form.card_type,
        card_number: normalizeCardNumber(form.card_number),
        exp_month: Number(form.exp_month),
        exp_year: Number(form.exp_year),
        cvv: form.cvv,
        is_default: methods.length === 0,
      });
      setForm(EMPTY_CARD_FORM);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await profileAPI.deletePaymentMethod(id);
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="card">
      <h2 className="card-title">Платіжні засоби</h2>
      {error && <div className="error-box">{error}</div>}

      {methods.length > 0 && (
        <div className="card-list">
          {methods.map((m) => (
            <div key={m.id} className="card-list__item">
              <div className="card-list__info">
                <span className={`card-list__badge card-list__badge--${m.card_type}`}>
                  {m.card_type === 'mastercard' ? 'MC' : 'VISA'}
                </span>
                <span>{formatCardDisplay(m)}</span>
                {m.is_default && <span className="card-list__default">основна</span>}
              </div>
              <button type="button" className="btn-outline" onClick={() => handleDelete(m.id)}>Видалити</button>
            </div>
          ))}
        </div>
      )}

      <div className="card-form-wrap">
        <h3 className="card-form-wrap__title">Додати картку</h3>
        <CardForm form={form} onChange={setForm} idPrefix="profile" />
        <div className="card-form-wrap__actions">
          <button type="button" className="btn-sm" onClick={handleAdd} disabled={saving}>
            {saving ? 'Збереження...' : 'Додати картку'}
          </button>
        </div>
      </div>
    </div>
  );
}

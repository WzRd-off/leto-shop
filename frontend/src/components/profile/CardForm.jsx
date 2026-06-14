import React from 'react';
import { CARD_TYPES } from '../../constants/appConstants';
import { formatCardNumberInput } from '../../utils/cardHelpers';
import { Field } from './CommonComponents';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR + i);

export default function CardForm({ form, onChange, idPrefix = 'card' }) {
  const set = (field, value) => onChange((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="card-form">
      <Field label="Платіжна система *">
        <div className="card-form__types">
          {CARD_TYPES.map((t) => (
            <label key={t.value} className={`card-form__type${form.card_type === t.value ? ' card-form__type--active' : ''}`}>
              <input
                type="radio"
                name={`${idPrefix}_type`}
                value={t.value}
                checked={form.card_type === t.value}
                onChange={() => set('card_type', t.value)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Номер картки *">
        <input
          className="input"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={form.card_number}
          onChange={(e) => set('card_number', formatCardNumberInput(e.target.value))}
        />
      </Field>

      <div className="card-form__row">
        <Field label="Дійсна до *">
          <div className="card-form__expiry">
            <select
              className="input"
              value={form.exp_month}
              onChange={(e) => set('exp_month', e.target.value)}
            >
              <option value="">Місяць</option>
              {Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                return (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                );
              })}
            </select>
            <select
              className="input"
              value={form.exp_year}
              onChange={(e) => set('exp_year', e.target.value)}
            >
              <option value="">Рік</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="CVV *">
          <input
            className="input"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={4}
            value={form.cvv}
            onChange={(e) => set('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </Field>
      </div>
    </div>
  );
}

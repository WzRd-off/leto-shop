import React, { useState, useEffect } from 'react';
import { Field, Spinner } from './CommonComponents';
import { useAuth } from '../../hooks/useAuth';
import { profileAPI } from '../../services/api';

export function ProfileTab() {
  const { user, isLoading: authLoading } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(!authLoading);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone: user.phone ?? '',
    });
    setEmail(user.email ?? '');
    setLoading(false);
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await profileAPI.updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="card">
      <h2 className="card-title">Персональні дані</h2>
      {error && <div className="error-box">{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 560 }}>
        <Field label="Ім'я">
          <input
            className="input"
            value={form.first_name}
            onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
          />
        </Field>
        <Field label="Прізвище">
          <input
            className="input"
            value={form.last_name}
            onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
          />
        </Field>
        <Field label="Телефон">
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/[^\d+]/g, '') }))}
            type="tel"
          />
        </Field>
        <Field label="Електронна пошта" hint="Email для входу">
          <input className="input" value={email} disabled />
        </Field>
      </div>
      <button type="button" onClick={handleSave} disabled={saving} className="btn-sm" style={{ marginTop: 28, minWidth: 180 }}>
        {saving ? 'Збереження...' : saved ? '✓ Збережено' : 'Зберегти зміни'}
      </button>
    </div>
  );
}

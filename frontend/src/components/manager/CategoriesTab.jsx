import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../../constants/Icons';
import { Spinner, EmptyState, Modal, Field } from './shared';
import { managerAPI } from '../../services/api';

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await managerAPI.getCategories();
      setCategories(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setError('Не вдалося завантажити категорії');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Назва категорії обовʼязкова');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await managerAPI.createCategory({ name: form.name.trim(), description: form.description.trim() });
      setModal(false);
      setForm({ name: '', description: '' });
      await fetchCategories();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вилучити категорію?')) return;
    try {
      await managerAPI.deleteCategory(id);
      await fetchCategories();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="mgr-section">
      <div className="mgr-section__header">
        <h2 className="mgr-page-title">Категорії</h2>
        <div className="mgr-section__actions">
          <button type="button" className="mgr-button mgr-button--primary" onClick={() => { setModal(true); setError(''); }}>
            {Icon.plus} Додати категорію
          </button>
        </div>
      </div>

      {error && !modal && <div className="mgr-error-box">{error}</div>}

      {loading ? (
        <Spinner />
      ) : !categories.length ? (
        <EmptyState text="Категорій ще немає." />
      ) : (
        <div className="mgr-table-wrapper">
          <table className="mgr-table">
            <thead>
              <tr className="mgr-table__head-row">
                {['Назва', 'Опис', ''].map((h) => (
                  <th key={h} className="mgr-table__head-cell">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, index) => (
                <tr
                  key={cat.id}
                  className={`mgr-table__row ${index % 2 === 0 ? 'mgr-table__row--even' : 'mgr-table__row--odd'}`}
                >
                  <td className="mgr-table__cell">{cat.name}</td>
                  <td className="mgr-table__cell">{cat.description || '—'}</td>
                  <td className="mgr-table__cell">
                    <button type="button" className="mgr-button mgr-button--danger mgr-button--small" onClick={() => handleDelete(cat.id)}>
                      {Icon.trash}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title="Нова категорія" onClose={() => setModal(false)}>
          {error && <div className="mgr-error-box">{error}</div>}
          <div className="mgr-form-grid">
            <Field label="Назва *">
              <input className="mgr-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Опис">
              <textarea className="mgr-input mgr-input--textarea" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </Field>
          </div>
          <div className="mgr-modal__actions">
            <button type="button" className="mgr-button mgr-button--outlined" onClick={() => setModal(false)}>Скасувати</button>
            <button type="button" className="mgr-button mgr-button--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

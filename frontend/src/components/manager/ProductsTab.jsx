import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Icon } from '../../constants/Icons';
import { Spinner, EmptyState, Modal, Field } from './shared';
import { managerAPI } from '../../services/api';
import { API_BASE_URL } from '../../services/config';

const validatePrice = (input) => {
  if (!input) return '';
  const filtered = input.replace(/[^\d,]/g, '');
  const commaIndex = filtered.indexOf(',');
  if (commaIndex === -1) return filtered;
  if (commaIndex === 0) return filtered.substring(1).replace(/,/g, '');
  return filtered.substring(0, commaIndex) + ',' + filtered.substring(commaIndex + 1).replace(/,/g, '');
};

export default function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    sku: '', name: '', description: '', price: '', category: '', stock_quantity: '0', image: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortSku, setSortSku] = useState('asc');
  const fileRef = useRef();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        managerAPI.getProducts(),
        managerAPI.getCategories(),
      ]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setError('');
    } catch {
      setError('Не вдалося завантажити товари');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.is_active !== false);
    if (filterCategory) list = list.filter((p) => p.category === filterCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      const cmp = a.sku.localeCompare(b.sku, 'uk');
      return sortSku === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [products, filterCategory, search, sortSku]);

  const openAdd = () => {
    setSelected(null);
    setForm({ sku: '', name: '', description: '', price: '', category: '', stock_quantity: '0', image: null });
    setModal('add');
    setError('');
  };

  const openEdit = (p) => {
    setSelected(p);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      category: p.category || '',
      stock_quantity: String(p.stock_quantity ?? 0),
      image: null,
    });
    setModal('edit');
    setError('');
  };

  const handleSave = async () => {
    if (!form.sku.trim() || !form.name.trim() || !form.price || !form.category) {
      setError('SKU, назва, категорія та ціна обовʼязкові');
      return;
    }
    if (modal === 'add' && !form.image) {
      setError('Зображення обовʼязкове для нового товару');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('sku', form.sku);
      formData.append('name', form.name);
      formData.append('description', form.description || '');
      formData.append('price', form.price.replace(',', '.'));
      formData.append('category', form.category);
      formData.append('stock_quantity', form.stock_quantity || '0');
      if (form.image) formData.append('image', form.image);

      if (modal === 'edit') {
        await managerAPI.updateProduct(selected.id, formData);
      } else {
        await managerAPI.createProduct(formData);
      }
      setModal(false);
      await fetchProducts();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вилучити товар з каталогу?')) return;
    try {
      await managerAPI.deleteProduct(id);
      await fetchProducts();
      setSelected(null);
    } catch {
      setError('Помилка видалення');
    }
  };

  return (
    <div className="mgr-section">
      <div className="mgr-section__header">
        <h2 className="mgr-page-title">Товари</h2>
        <div className="mgr-section__actions">
          <button type="button" className="mgr-button mgr-button--primary" onClick={openAdd}>
            {Icon.plus} Додати товар
          </button>
        </div>
      </div>

      {error && !modal && <div className="mgr-error-box">{error}</div>}

      <div className="mgr-toolbar">
        <input
          className="mgr-input mgr-toolbar__search"
          placeholder="Пошук за назвою..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="mgr-input mgr-input--select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">Усі категорії</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select className="mgr-input mgr-input--select" value={sortSku} onChange={(e) => setSortSku(e.target.value)}>
          <option value="asc">Артикул А-Я</option>
          <option value="desc">Артикул Я-А</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : !filtered.length ? (
        <EmptyState text={products.length ? 'Товарів не знайдено.' : 'Товарів ще немає.'} />
      ) : (
        <div className="mgr-table-wrapper">
          <table className="mgr-table">
            <thead>
              <tr className="mgr-table__head-row">
                {['', 'SKU', 'Назва', 'Категорія', 'Ціна', 'Склад', ''].map((h) => (
                  <th key={h} className="mgr-table__head-cell">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, index) => (
                <tr
                  key={p.id}
                  className={`mgr-table__row ${index % 2 === 0 ? 'mgr-table__row--even' : 'mgr-table__row--odd'}`}
                >
                  <td className="mgr-table__cell mgr-table__cell--image">
                    {p.image_url ? (
                      <img src={`${API_BASE_URL}${p.image_url}`} alt="" className="mgr-table__image" />
                    ) : (
                      <div className="mgr-image-placeholder">{Icon.image}</div>
                    )}
                  </td>
                  <td className="mgr-table__cell">{p.sku}</td>
                  <td className="mgr-table__cell">{p.name}</td>
                  <td className="mgr-table__cell">{p.category}</td>
                  <td className="mgr-table__cell">{p.price} ₴</td>
                  <td className="mgr-table__cell">{p.stock_quantity}</td>
                  <td className="mgr-table__cell">
                    <button type="button" className="mgr-button mgr-button--small" onClick={() => openEdit(p)}>{Icon.edit}</button>
                    <button type="button" className="mgr-button mgr-button--danger mgr-button--small" onClick={() => handleDelete(p.id)}>{Icon.trash}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Новий товар' : 'Редагувати товар'} onClose={() => setModal(false)}>
          {error && <div className="mgr-error-box">{error}</div>}
          <div className="mgr-form-grid">
            <Field label="SKU *">
              <input className="mgr-input" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
            </Field>
            <Field label="Назва *">
              <input className="mgr-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Категорія *">
              <select className="mgr-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                <option value="">Оберіть</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Ціна *">
              <input className="mgr-input" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: validatePrice(e.target.value) }))} />
            </Field>
            <Field label="На складі">
              <input className="mgr-input" type="number" value={form.stock_quantity} onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))} />
            </Field>
            <Field label="Опис">
              <textarea className="mgr-input mgr-input--textarea" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </Field>
            <Field label="Зображення">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setForm((p) => ({ ...p, image: e.target.files[0] }))} />
              <button type="button" className="mgr-button mgr-button--outlined" onClick={() => fileRef.current?.click()}>Обрати файл</button>
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

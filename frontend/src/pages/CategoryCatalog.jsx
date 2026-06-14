import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Icons } from '../constants/Icons';
import FilterSidebar from '../components/order/FilterSidebar';
import ProductCard from '../components/order/ProductCard';
import { CATEGORY_META, slugToCategory } from '../constants/appConstants';
import { productsAPI } from '../services/api';

export default function CategoryCatalog() {
  const { categorySlug } = useParams();
  const category = slugToCategory(categorySlug);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const params = { category };
        if (priceRange.min) params.priceMin = priceRange.min;
        if (priceRange.max) params.priceMax = priceRange.max;
        if (search.trim()) params.search = search.trim();
        if (sortBy !== 'default') params.sort = sortBy;

        const data = await productsAPI.getAll(params);
        setProducts(Array.isArray(data) ? data : []);
        setError('');
      } catch {
        setError('Не вдалося завантажити каталог');
      } finally {
        setLoading(false);
      }
    })();
  }, [category, search, priceRange, sortBy]);

  const hasActiveFilters = !!(search || priceRange.min || priceRange.max || sortBy !== 'default');

  const resetFilters = () => {
    setSearch('');
    setPriceRange({ min: '', max: '' });
    setSortBy('default');
  };

  const meta = CATEGORY_META[category];

  return (
    <>
      <Header />
      <div className="co-hero co-hero--compact">
        <div className="co-hero__inner">
          <Link to="/catalog" className="co-breadcrumb">
            {Icons.chevronLeft} Усі категорії
          </Link>
          <h1 className="co-hero__title">{category}</h1>
          {meta?.description && (
            <p className="co-hero__sub">{meta.description}</p>
          )}
        </div>
      </div>

      <div className="co-page">
        <div className="co-layout co-container">
          <FilterSidebar
            search={search}
            onSearchChange={setSearch}
            priceRange={priceRange}
            onPriceChange={(field, val) => setPriceRange((p) => ({ ...p, [field]: val }))}
            sortBy={sortBy}
            onSortChange={setSortBy}
            hasActiveFilters={hasActiveFilters}
            onReset={resetFilters}
            hideCategories
          />

          <div className="co-content">
            <div className="co-results-bar">
              <p className="co-results-bar__count">
                {loading ? 'Завантаження...' : `Знайдено товарів: ${products.length}`}
              </p>
              {hasActiveFilters && <div className="co-filters-badge">Фільтри активні</div>}
            </div>

            {error && <div className="co-error">{error}</div>}

            {loading ? (
              <div className="co-spinner-wrap"><div className="co-spinner" /></div>
            ) : products.length === 0 ? (
              <div className="co-empty">
                {Icons.imagePlaceholder}
                <p className="co-empty__text">Товарів не знайдено</p>
                <button type="button" className="co-empty__reset" onClick={resetFilters}>
                  Скинути фільтри
                </button>
              </div>
            ) : (
              <div className="co-grid">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

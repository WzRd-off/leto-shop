import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Icons } from '../constants/Icons';
import { CATEGORY_META, categoryToSlug } from '../constants/appConstants';
import { productsAPI } from '../services/api';
import { API_BASE_URL } from '../services/config';

const GRADIENTS = [
  'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)',
  'linear-gradient(135deg, #6a1b9a 0%, #ab47bc 100%)',
  'linear-gradient(135deg, #006064 0%, #26a69a 100%)',
  'linear-gradient(135deg, #e65100 0%, #ff9800 100%)',
  'linear-gradient(135deg, #283593 0%, #5c6bc0 100%)',
];

export default function CatalogOverview() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsAPI.getAll(),
      productsAPI.getCategories(),
    ])
      .then(([prodData, catData]) => {
        setProducts(Array.isArray(prodData) ? prodData : []);
        setCategories(Array.isArray(catData) ? catData : []);
      })
      .catch(() => {
        setProducts([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const categoryStats = useMemo(() => {
    const stats = {};
    for (const cat of categories) {
      const items = products.filter((p) => p.category === cat.name);
      stats[cat.name] = {
        count: items.length,
        image: items.find((p) => p.image_url)?.image_url || null,
        description: cat.description,
      };
    }
    return stats;
  }, [products, categories]);

  return (
    <>
      <Header />
      <div className="co-hero">
        <div className="co-hero__inner">
          <div className="co-hero__eyebrow">
            <span className="co-hero__eyebrow-icon">{Icons.leaf}</span>
            <span className="co-hero__eyebrow-text">Каталог рослин</span>
          </div>
          <h1 className="co-hero__title">Оберіть категорію</h1>
          <p className="co-hero__sub">
            Рідкісні кімнатні, квітучі та екзотичні рослини — знайдіть свою ідеальну зелень.
          </p>
        </div>
      </div>

      <div className="co-page">
        <div className="co-container">
          {loading ? (
            <div className="co-spinner-wrap"><div className="co-spinner" /></div>
          ) : (
            <div className="cat-grid">
              {categories.map((cat, idx) => {
                const meta = CATEGORY_META[cat.name] || {};
                const { count, image, description } = categoryStats[cat.name] || { count: 0, image: null, description: cat.description };
                return (
                  <Link
                    key={cat.id}
                    to={`/catalog/${categoryToSlug(cat.name)}`}
                    className="cat-card"
                  >
                    <div
                      className="cat-card__bg"
                      style={{
                        background: image
                          ? `linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%), url(${API_BASE_URL}${image}) center/cover`
                          : meta.gradient || GRADIENTS[idx % GRADIENTS.length],
                      }}
                    />
                    <div className="cat-card__content">
                      <span className="cat-card__count">{count} товарів</span>
                      <h2 className="cat-card__title">{cat.name}</h2>
                      <p className="cat-card__desc">{description || meta.description}</p>
                      <span className="cat-card__arrow">
                        Переглянути {Icons.chevronRight}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

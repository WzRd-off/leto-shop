import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '../constants/Icons';
import ProductsTab from '../components/manager/ProductsTab';
import OrdersTab from '../components/manager/OrdersTab';
import CategoriesTab from '../components/manager/CategoriesTab';

const TABS = [
  { id: 'products', label: 'Товари', icon: Icon.leaf },
  { id: 'categories', label: 'Категорії', icon: Icon.tag },
  { id: 'orders', label: 'Замовлення', icon: Icon.list },
];

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="mgr-page">
      <div className="mgr-layout">
        <header className="mgr-header">
          <div className="mgr-header__logo">
            <span>{Icon.leaf}</span>
            <div className="mgr-header__logo-text">
              <span>FloraRare</span>
              <span>керівник</span>
            </div>
          </div>

          <nav className="mgr-tab-list">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`mgr-tab ${activeTab === tab.id ? 'mgr-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <button type="button" className="mgr-logout-button" onClick={handleLogout}>
            {Icon.logout}
            <span>Вийти</span>
          </button>
        </header>

        <main className="mgr-content">
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'orders' && <OrdersTab />}
        </main>
      </div>
    </div>
  );
}

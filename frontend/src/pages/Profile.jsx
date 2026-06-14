import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { ProfileTab } from '../components/profile/ProfileTab';
import { PaymentMethodsTab } from '../components/profile/PaymentMethodsTab';
import { HistoryTab } from '../components/profile/HistoryTab';
import { ChangePasswordTab } from '../components/profile/ChangePassword';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '../constants/Icons';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const tabs = [
    { id: 'profile', label: 'Мій профіль', icon: Icon.user },
    { id: 'payments', label: 'Платіжні засоби', icon: Icon.edit },
    { id: 'history', label: 'Замовлення', icon: Icon.list },
    { id: 'password', label: 'Змінити пароль', icon: Icon.edit },
  ];

  const isManager = user?.role_id === 2;

  const renderTab = () => {
    switch (activeTab) {
      case 'profile': return <ProfileTab />;
      case 'payments': return <PaymentMethodsTab />;
      case 'history': return <HistoryTab />;
      case 'password': return <ChangePasswordTab />;
      default: return null;
    }
  };

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    : '...';

  return (
    <>
      <Header />
      <div className="profile-page">
        <div className="profile-grid">
          <aside className="profile-sidebar">
            <div className="profile-avatar-section">
              <div className="profile-avatar">{Icon.user}</div>
              <div className="profile-user-info">
                <p className="profile-user-name">{displayName}</p>
                <p className="profile-user-role">
                  {user?.role_id === 2 ? 'Керівник' : 'Клієнт'}
                </p>
              </div>
            </div>

            <nav className="profile-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`profile-nav__item ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <span className="profile-nav__icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

            {isManager && (
              <div className="profile-role-actions">
                <button
                  type="button"
                  onClick={() => navigate('/manager')}
                  className="profile-role-btn profile-role-btn--manager"
                >
                  {Icon.edit} Управління
                </button>
              </div>
            )}

            <button type="button" onClick={handleLogout} className="profile-logout">
              <span className="profile-logout-icon">{Icon.logout}</span>
              Вийти з акаунта
            </button>
          </aside>

          <main className="profile-main">{renderTab()}</main>
        </div>
      </div>

      <div className="profile-mobile-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`profile-mobile-tabs__btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="profile-mobile-tabs__icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <Footer />
    </>
  );
}

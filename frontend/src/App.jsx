import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import MainPage from './pages/Main.jsx';
import AuthPage from './pages/Auth.jsx';
import ProfilePage from './pages/Profile.jsx';
import ManagerPage from './pages/Manager.jsx';
import ContactsPage from './pages/Contacts.jsx';
import CatalogOverview from './pages/CatalogOverview.jsx';
import CategoryCatalog from './pages/CategoryCatalog.jsx';
import ProductDetailPage from './pages/ProductDetail.jsx';
import CartPage from './pages/Cart.jsx';
import CheckoutPage from './pages/Checkout.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/catalog" element={<CatalogOverview />} />
          <Route path="/catalog/:categorySlug" element={<CategoryCatalog />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/manager" element={<ProtectedRoute allowedRole={2}><ManagerPage /></ProtectedRoute>} />
          <Route path="/services" element={<CatalogOverview />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

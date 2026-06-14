import { API_BASE_URL } from './config';

export const getJsonHeaders = () => ({
  'Content-Type': 'application/json',
});

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const headers = isFormData ? undefined : (options.headers || getJsonHeaders());

  try {
    const response = await fetch(url, {
      ...options,
      ...(headers && { headers }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Помилка ${response.status}`);
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const authAPI = {
  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (first_name, last_name, email, password, phone = '') =>
    apiFetch('/auth/reg', {
      method: 'POST',
      body: JSON.stringify({ first_name, last_name, email, password, phone }),
    }),

  logout: () => apiFetch('/auth/logout', { method: 'POST' }),

  me: () => apiFetch('/auth/me'),
};

export const productsAPI = {
  getFeatured: () => apiFetch('/products/featured'),

  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/products${q ? `?${q}` : ''}`);
  },

  getById: (id) => apiFetch(`/products/${id}`),

  getCategories: () => apiFetch('/products/categories'),
};

export const cartAPI = {
  get: () => apiFetch('/cart'),
  add: (product_id, quantity = 1) =>
    apiFetch('/cart', { method: 'POST', body: JSON.stringify({ product_id, quantity }) }),
  update: (productId, quantity) =>
    apiFetch(`/cart/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  remove: (productId) => apiFetch(`/cart/${productId}`, { method: 'DELETE' }),
  clear: () => apiFetch('/cart', { method: 'DELETE' }),
};

export const checkoutAPI = {
  pay: (payment_method_id) =>
    apiFetch('/checkout/pay', {
      method: 'POST',
      body: JSON.stringify({ payment_method_id }),
    }),
};

export const commentsAPI = {
  add: (productId, data) =>
    apiFetch(`/comments/products/${productId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const profileAPI = {
  getMyProfile: () => apiFetch('/profile/my_profile'),

  updateProfile: (data) =>
    apiFetch('/profile/update_profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (oldPassword, newPassword) =>
    apiFetch('/profile/change-password', {
      method: 'PUT',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),

  getPaymentMethods: () => apiFetch('/profile/payment-methods'),

  addPaymentMethod: (data) =>
    apiFetch('/profile/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deletePaymentMethod: (id) =>
    apiFetch(`/profile/payment-methods/${id}`, { method: 'DELETE' }),
};

export const ordersAPI = {
  getMyOrders: () => apiFetch('/orders/my_orders'),
};

export const managerAPI = {
  getCategories: () => apiFetch('/manager/categories'),

  createCategory: (data) =>
    apiFetch('/manager/categories', { method: 'POST', body: JSON.stringify(data) }),

  deleteCategory: (id) =>
    apiFetch(`/manager/categories/${id}`, { method: 'DELETE' }),

  getProducts: () => apiFetch('/manager/products'),

  createProduct: (formData) =>
    apiFetch('/manager/products', { method: 'POST', body: formData }),

  updateProduct: (id, formData) =>
    apiFetch(`/manager/products/${id}`, { method: 'PUT', body: formData }),

  deleteProduct: (id) =>
    apiFetch(`/manager/products/${id}`, { method: 'DELETE' }),

  getOrders: () => apiFetch('/manager/orders'),

  getOrder: (id) => apiFetch(`/manager/orders/${id}`),

  updateOrderStatus: (orderId, body) =>
    apiFetch(`/manager/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  closeOrder: (orderId) =>
    apiFetch(`/manager/orders/${orderId}/close`, { method: 'POST' }),
};

export const healthAPI = {
  check: () => apiFetch('/health'),
};

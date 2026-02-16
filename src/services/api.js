// src/services/api.js
// Centralized API service with auth support

import { auth } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

class ApiService {
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...auth.getAuthHeader(),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            // Handle new response format {success: true, data: [...]}
            return data.data !== undefined ? data.data : data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Auth APIs
    async register(userData) {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed');
        return data.data;
    }

    async login(email, password) {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');
        return data.data;
    }

    // Stall APIs
    async getAllStalls() {
        return this.request('/stalls');
    }

    async createStall(stallData) {
        return this.request('/stalls', {
            method: 'POST',
            body: JSON.stringify(stallData),
        });
    }

    async deleteStall(id) {
        return this.request(`/stalls/${id}`, {
            method: 'DELETE',
        });
    }

    // Menu APIs
    async getAllMenuItems() {
        return this.request('/menu');
    }

    async getMenuItems(stallId) {
        // Get menu items for specific stall or all if no stallId
        if (stallId) {
            return this.request(`/menu?stallId=${stallId}`);
        }
        return this.getAllMenuItems();
    }

    async createMenuItem(itemData) {
        return this.request('/menu', {
            method: 'POST',
            body: JSON.stringify(itemData),
        });
    }

    async updateMenuItem(id, itemData) {
        return this.request(`/menu/${id}`, {
            method: 'PUT',
            body: JSON.stringify(itemData),
        });
    }

    async deleteMenuItem(id) {
        return this.request(`/menu/${id}`, {
            method: 'DELETE',
        });
    }

    // Order APIs
    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }

    async getAllOrders(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/orders?${params}`);
    }

    async getOrdersByStall(stallId) {
        return this.getAllOrders({ stallId });
    }

    async updateOrderItemStatus(orderId, itemId, status) {
        return this.request(`/orders/${orderId}/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    async updateOrderStatus(orderId, status) {
        return this.request(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    async getUserOrders() {
        // Get orders for the currently logged-in user
        // Try with auth token first, then fallback to userId in query
        const user = auth.getUser();
        const token = auth.getToken();
        
        console.log('getUserOrders - User:', user ? { id: user.id, email: user.email } : 'Not found');
        console.log('getUserOrders - Token:', token ? 'Found' : 'Not found');
        
        // Build URL with userId as fallback
        const userId = user?.id;
        const url = userId ? `${API_BASE}/orders/my-orders?userId=${userId}` : `${API_BASE}/orders/my-orders`;
        
        console.log('getUserOrders - URL:', url);
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            
            console.log('getUserOrders - Response status:', response.status);
            
            const data = await response.json();
            
            if (!response.ok) {
                console.error('getUserOrders - Error response:', data);
                // If 401 and we have userId, the token might be invalid but userId should work
                if (response.status === 401 && userId) {
                    console.log('Auth failed, but userId provided - backend should handle this');
                    throw new Error(data.error || 'Authentication failed. Please login again.');
                }
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            console.log('getUserOrders - Raw response data:', data);
            console.log('getUserOrders - Data structure:', {
                isArray: Array.isArray(data),
                hasData: !!data.data,
                dataType: typeof data,
                keys: data && typeof data === 'object' ? Object.keys(data) : 'N/A'
            });
            
            // Handle different response formats
            let result;
            if (Array.isArray(data)) {
                result = data;
            } else if (data && data.data !== undefined) {
                result = data.data;
            } else if (data && data.success && data.data) {
                result = data.data;
            } else {
                result = data;
            }
            
            console.log('getUserOrders - Final result:', result);
            console.log('getUserOrders - Result type:', Array.isArray(result) ? 'Array' : typeof result);
            console.log('getUserOrders - Result length:', Array.isArray(result) ? result.length : 'N/A');
            
            return result;
        } catch (error) {
            console.error('getUserOrders error:', error);
            throw error;
        }
    }

    // Feedback APIs
    async getAllFeedbacks() {
        return this.request('/feedbacks');
    }

    async createFeedback(feedbackData) {
        return this.request('/feedbacks', {
            method: 'POST',
            body: JSON.stringify(feedbackData),
        });
    }

    async getFeedbackSuggestions(feedbackData) {
        return this.request('/ai/feedback-suggestions', {
            method: 'POST',
            body: JSON.stringify(feedbackData),
        });
    }

    async chatWithBot(message, context = '') {
        return this.request('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message, context }),
        });
    }

    async getFeedbackAnalysis() {
        return this.request('/ai/feedback-analysis');
    }

    // Password Management APIs
    async forgotPassword(email) {
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send reset link');
        return data;
    }

    async resetPassword(token, newPassword) {
        const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to reset password');
        return data;
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    }

    // Get available stalls (for shopkeeper registration)
    async getAvailableStalls() {
        return this.request('/stalls'); // Will filter on frontend or add endpoint
    }

    // Admin APIs
    async getPendingShopkeepers() {
        return this.request('/admin/pending-shopkeepers');
    }

    async approveShopkeeper(id, approve) {
        return this.request(`/admin/approve-shopkeeper/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ approve }),
        });
    }

    // Coupon APIs
    async validateCoupon(code, orderAmount) {
        return this.request('/coupons/validate', {
            method: 'POST',
            body: JSON.stringify({ code, orderAmount }),
        });
    }

    async getCoupons() {
        return this.request('/coupons');
    }

    async createCoupon(couponData) {
        return this.request('/coupons', {
            method: 'POST',
            body: JSON.stringify(couponData),
        });
    }

    async toggleCouponStatus(id) {
        return this.request(`/coupons/${id}/toggle`, {
            method: 'PUT',
        });
    }

    async deleteCoupon(id) {
        return this.request(`/coupons/${id}`, {
            method: 'DELETE',
        });
    }

    // Search APIs
    async search(query, type = 'all') {
        return this.request(`/search?q=${encodeURIComponent(query)}&type=${type}`);
    }

    async getSearchSuggestions(query) {
        const response = await fetch(`${API_BASE}/search/suggestions?q=${encodeURIComponent(query)}`, {
            headers: {
                'Content-Type': 'application/json',
                ...auth.getAuthHeader(),
            },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to get suggestions');
        return data.data || data;
    }

    async getPopularSearches() {
        return this.request('/search/popular');
    }

    // Generic GET method for direct API calls
    async get(endpoint) {
        return this.request(endpoint);
    }
}

export default new ApiService();

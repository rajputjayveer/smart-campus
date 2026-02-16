// Admin API endpoints

const getAuthHeaders = () => {
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('soueats_token='))
        ?.split('=')[1];

    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const adminAPI = {
    // Get pending shopkeeper registrations
    getPendingShopkeepers: async () => {
        const response = await fetch(`${API_BASE}/admin/pending-shopkeepers`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch pending shopkeepers');
        return data.data;
    },

    // Approve or reject shopkeeper
    approveShopkeeper: async (id, approve) => {
        const response = await fetch(`${API_BASE}/admin/approve-shopkeeper/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ approve })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to process approval');
        return data;
    },

    // Get all shopkeepers
    getAllShopkeepers: async () => {
        const response = await fetch(`${API_BASE}/admin/shopkeepers`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch shopkeepers');
        return data.data;
    },

    // Toggle shopkeeper status
    toggleShopkeeperStatus: async (id) => {
        const response = await fetch(`${API_BASE}/admin/shopkeeper/${id}/toggle-status`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to toggle status');
        return data;
    },

    // Get available stalls (for shopkeeper registration)
    getAvailableStalls: async () => {
        const response = await fetch(`${API_BASE}/admin/available-stalls`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch available stalls');
        return data.data;
    }
};

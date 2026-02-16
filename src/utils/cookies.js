// src/utils/cookies.js
// Cookie-based authentication storage (more secure than localStorage)

export const cookies = {
    // Set a cookie
    set: (name, value, days = 7) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    },

    // Get a cookie
    get: (name) => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },

    // Delete a cookie
    delete: (name) => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    },

    // Clear all auth cookies
    clearAuth: () => {
        cookies.delete('soueats_token');
        cookies.delete('soueats_user');
    }
};

// Authentication helpers using cookies
export const auth = {
    login: (token, user) => {
        cookies.set('soueats_token', token, 7); // 7 days expiry
        cookies.set('soueats_user', JSON.stringify(user), 7);
    },

    logout: () => {
        cookies.clearAuth();
    },

    getToken: () => {
        return cookies.get('soueats_token');
    },

    getUser: () => {
        const userStr = cookies.get('soueats_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: () => {
        return !!cookies.get('soueats_token');
    },

    getAuthHeader: () => {
        const token = auth.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};

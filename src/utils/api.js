/**
 * API Utility for Multi-Tenant Requests
 * Automatically includes auth token in all requests
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/ventures')
 * @param {object} options - Fetch options
 * @returns {Promise<object>} - Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('admin_token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http')
        ? endpoint
        : `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers
    });

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
};

/**
 * API helper methods
 */
export const api = {
    /**
     * GET request
     */
    get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),

    /**
     * POST request
     */
    post: (endpoint, body) => apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
    }),

    /**
     * PUT request
     */
    put: (endpoint, body) => apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body)
    }),

    /**
     * PATCH request
     */
    patch: (endpoint, body) => apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body)
    }),

    /**
     * DELETE request
     */
    delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
};

/**
 * V1 API endpoints (multi-tenant aware)
 */
export const endpoints = {
    // Auth
    auth: {
        login: '/api/v1/auth/login',
        profile: '/api/v1/auth/me',
        changePassword: '/api/v1/auth/change-password'
    },

    // Ventures
    ventures: {
        list: '/api/v1/ventures',
        get: (id) => `/api/v1/ventures/${id}`,
        create: '/api/v1/ventures',
        update: (id) => `/api/v1/ventures/${id}`,
        delete: (id) => `/api/v1/ventures/${id}`,
        setDefault: (id) => `/api/v1/ventures/${id}/set-default`,
        calibration: (id) => `/api/v1/ventures/${id}/calibration`
    },

    // Plots
    plots: {
        list: '/api/v1/plots',
        byVenture: (ventureId) => `/api/v1/plots/venture/${ventureId}`,
        get: (id) => `/api/v1/plots/${id}`,
        create: '/api/v1/plots',
        update: (id) => `/api/v1/plots/${id}`,
        delete: (id) => `/api/v1/plots/${id}`,
        bulkCreate: '/api/v1/plots/bulk',
        updateStatus: (id) => `/api/v1/plots/${id}/status`
    },

    // Customers
    customers: {
        list: '/api/v1/customers',
        get: (id) => `/api/v1/customers/${id}`,
        detail: (id) => `/api/v1/customers/${id}`,
        create: '/api/v1/customers',
        update: (id) => `/api/v1/customers/${id}`,
        delete: (id) => `/api/v1/customers/${id}`,
        updateStage: (id) => `/api/v1/customers/${id}/stage`,
        pipeline: '/api/v1/customers/pipeline'
    },

    // Bookings
    bookings: {
        list: '/api/v1/bookings',
        get: (id) => `/api/v1/bookings/${id}`,
        detail: (id) => `/api/v1/bookings/${id}`,
        create: '/api/v1/bookings',
        update: (id) => `/api/v1/bookings/${id}`,
        updateStatus: (id) => `/api/v1/bookings/${id}/status`,
        addPayment: (id) => `/api/v1/bookings/${id}/payments`,
        cancel: (id) => `/api/v1/bookings/${id}/cancel`,
        stats: '/api/v1/bookings/stats'
    },

    // Enquiries
    enquiries: {
        list: '/api/v1/enquiries',
        get: (id) => `/api/v1/enquiries/${id}`,
        create: '/api/v1/enquiries',
        update: (id) => `/api/v1/enquiries/${id}`,
        delete: (id) => `/api/v1/enquiries/${id}`,
        convertToCustomer: (id) => `/api/v1/enquiries/${id}/convert`
    },

    // Tenant settings (for admin role)
    tenant: {
        profile: '/api/v1/tenant/profile',
        usage: '/api/v1/tenant/usage',
        apiKeys: {
            list: '/api/v1/tenant/api-keys',
            create: '/api/v1/tenant/api-keys',
            revoke: (id) => `/api/v1/tenant/api-keys/${id}`
        }
    },

    // Super Admin (for super_admin role only)
    superAdmin: {
        stats: '/api/v1/super-admin/stats',
        revenue: '/api/v1/super-admin/stats/revenue',
        activityLog: '/api/v1/super-admin/activity-log',
        tenants: {
            list: '/api/v1/super-admin/tenants',
            get: (id) => `/api/v1/super-admin/tenants/${id}`,
            create: '/api/v1/super-admin/tenants',
            update: (id) => `/api/v1/super-admin/tenants/${id}`,
            updateStatus: (id) => `/api/v1/super-admin/tenants/${id}/status`,
            regenerateApiKey: (id) => `/api/v1/super-admin/tenants/${id}/regenerate-api-key`,
            delete: (id) => `/api/v1/super-admin/tenants/${id}`
        }
    },

    // Legacy endpoints (for backward compatibility during migration)
    // These will be deprecated in favor of v1 endpoints
    legacy: {
        ventures: '/api/ventures',
        plots: '/api/plot',
        enquiries: '/api/enquiry'
    }
};

export default api;

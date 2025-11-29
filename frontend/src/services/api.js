import { getAuth } from 'firebase/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper to get current user auth headers
const getAuthHeaders = () => {
    const auth = getAuth();
    const user = auth.currentUser;

    // Check for demo user in localStorage if no Firebase user
    if (!user) {
        const demoUser = localStorage.getItem('user');
        if (demoUser) {
            const parsed = JSON.parse(demoUser);
            return {
                'X-User-Id': parsed.uid || 'demo-user',
                'X-User-Name': parsed.displayName || 'Demo User'
            };
        }
        return {};
    }

    return {
        'X-User-Id': user.uid,
        'X-User-Name': user.displayName || user.email || 'Unknown User'
    };
};

export const api = {
    // Health Check
    checkHealth: async () => {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.json();
    },

    // Prediction
    predict: async (formData) => {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders()
            },
            body: formData // Content-Type is set automatically for FormData
        });
        if (!response.ok) throw new Error('Prediction failed');
        return response.json();
    },

    // 3. Store on Blockchain (Robust)
    storeOnChain: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/store-on-chain`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Blockchain anchoring failed');
            }
            return await response.json();
        } catch (error) {
            console.error("Blockchain API Error:", error);
            throw error;
        }
    },

    // 4. Retry Anchor (New)
    retryAnchor: async (screeningId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/retry-anchor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ screeningId })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Retry failed');
            }
            return await response.json();
        } catch (error) {
            console.error("Retry API Error:", error);
            throw error;
        }
    },

    // 5. Chat
    chat: async (messages) => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ messages })
            });
            if (!response.ok) throw new Error('Chat service unavailable');
            return await response.json();
        } catch (error) {
            console.error("Chat API Error:", error);
            throw error;
        }
    },

    // 6. Analytics
    getTodayStats: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/stats/today`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) return { countToday: 0, highRiskPercent: 0 };
            return await response.json();
        } catch (error) {
            return { countToday: 0, highRiskPercent: 0 };
        }
    },

    getRecentScreenings: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/screenings/recent`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            return [];
        }
    },

    getAnalyticsSummary: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/analytics/summary`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    },

    // Admin
    resetDemoData: async () => {
        await fetch(`${API_BASE_URL}/admin/clear-screenings`, { method: 'POST' });
    }
};

export default api;

import { useAuth } from './useAuth';

export function useApi() {
  const { getToken } = useAuth();

  const fetchApi = async (endpoint, options = {}) => {
    let token = null;
    try {
      token = await getToken();
    } catch (err) {
      console.warn('Failed to get token for API request', err);
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'API request failed');
    }

    // Some endpoints might return empty body (e.g. DELETE or 204 No Content)
    try {
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  return fetchApi;
}

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const {
    isAuthenticated,
    user,
    isLoading: auth0Loading,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
  } = useAuth0();

  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    async function initSession() {
      if (auth0Loading) return;
      
      if (!isAuthenticated) {
        console.log('Auth0 says NOT authenticated. Clearing session user.');
        setSessionUser(null);
        setLoading(false);
        return;
      }

      try {
        let token = null;
        try {
          token = await getAccessTokenSilently();
        } catch (tokenErr) {
          console.warn('Could not get token silently (this is normal if no API audience is configured):', tokenErr);
        }
        
        let dbUser = null;
        if (token) {
          try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const res = await fetch(`${baseUrl}/user/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              dbUser = await res.json();
            }
          } catch (e) {
            console.error('Failed to fetch db profile', e);
          }
        }
        
        // As long as Auth0 says we are authenticated, we let the user in.
        setSessionUser({ ...user, ...dbUser, token, dbId: dbUser?._id });
      } catch (err) {
        console.error('Session init failed:', err);
        setSessionUser(null);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [isAuthenticated, auth0Loading, user, getAccessTokenSilently]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!sessionUser,
        user: sessionUser,
        loading: loading || auth0Loading,
        login: loginWithRedirect,
        logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
        getToken: getAccessTokenSilently,
        refreshProfile: async () => {
          try {
            const token = await getAccessTokenSilently();
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const res = await fetch(`${baseUrl}/user/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const dbUser = await res.json();
              setSessionUser(prev => ({ ...prev, ...dbUser }));
            }
          } catch (e) {
            console.error('Failed to refresh profile', e);
          }
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

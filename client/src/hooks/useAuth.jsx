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
        setSessionUser(null);
        setLoading(false);
        return;
      }

      try {
        const token = await getAccessTokenSilently();
        // Since we are mocking the backend logic for now, we just pretend the user is authenticated
        // In a real app we would call /api/auth/me to sync with our database
        setSessionUser({ ...user, token });
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

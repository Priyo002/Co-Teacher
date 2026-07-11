import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './hooks/useAuth';
import App from './App.jsx';
import './index.css';

function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate();

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || '/', { replace: true });
  };

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN || "placeholder-domain.auth0.com"}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || "placeholder-client-id"}
      authorizationParams={{ redirect_uri: window.location.origin }}
      cacheLocation="localstorage"
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Auth0ProviderWithNavigate>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Auth0ProviderWithNavigate>
  </BrowserRouter>
);

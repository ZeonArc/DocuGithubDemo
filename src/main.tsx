import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.tsx'

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-docugithub.us.auth0.com';
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'your_client_id';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: 'https://api.github.com/',
        scope: 'openid profile email read:user repo'
      }}
      cacheLocation="localstorage"
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
)

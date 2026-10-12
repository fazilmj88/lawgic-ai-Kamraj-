import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { NavigationProvider } from './context/NavigationContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </AuthProvider>
  </StrictMode>,
);


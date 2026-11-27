import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import App from './App';
import './styles/global.css';

// Register a strict default Trusted Types policy so DOM-XSS sinks are guarded
if (typeof window !== 'undefined' && window.trustedTypes && window.trustedTypes.createPolicy) {
  if (!window.trustedTypes.defaultPolicy) {
    window.trustedTypes.createPolicy('default', {
      createHTML: (input) =>
        String(input)
          .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
          .replace(/<(iframe|object|embed|base|meta)[^>]*>/gi, '')
          .replace(/\son\w+\s*=/gi, ' data-blocked-event='),
      createScriptURL: (input) => {
        const str = String(input);
        if (str.startsWith('/') && !str.startsWith('//')) return str;
        if (str.startsWith(window.location.origin + '/')) return str;
        throw new TypeError('Blocked untrusted script URL');
      },
      createScript: () => {
        throw new TypeError('Blocked untrusted script execution');
      },
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);

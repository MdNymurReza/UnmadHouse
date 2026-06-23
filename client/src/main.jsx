import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { MonthProvider } from './context/MonthContext.jsx';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <MonthProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MonthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);

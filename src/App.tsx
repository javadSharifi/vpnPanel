import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import LoginPage from './pages/LoginPage';
import MainPanel from './pages/MainPanel';
import CustomerSubPage from './pages/CustomerSubPage';

function ThemeInit() {
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, []);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <ThemeInit />
      <HashRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/panel" element={<MainPanel />} />
          <Route path="/sub/:gistId" element={<CustomerSubPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}

function RootRedirect() {
  const isLoggedIn = Boolean(localStorage.getItem('github_token'));
  if (isLoggedIn) {
    return <Navigate to="/panel" replace />;
  }
  return <LoginPage />;
}

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import LoginPage from './pages/LoginPage';
import MainPanel from './pages/MainPanel';
import CustomerSubPage from './pages/CustomerSubPage';

export default function App() {
  return (
    <ToastProvider>
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    if (localStorage.getItem('github_token')) {
      navigate('/panel', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github+json',
        },
      });

      if (res.status === 401) {
        setError('Invalid token');
        return;
      }

      if (!res.ok) {
        setError('Connection error, try again');
        return;
      }

      const data = await res.json();
      localStorage.setItem('github_token', token);
      localStorage.setItem('github_username', data.login);
      addToast('Logged in successfully', 'success');
      navigate('/panel', { replace: true });
    } catch {
      setError('Connection error, try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>VPN Panel</h1>
        <p className="login-subtitle">Enter your GitHub token</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <div className="password-wrapper">
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="GitHub Personal Access Token"
                value={token}
                onChange={e => setToken(e.target.value)}
                required
                autoFocus
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowToken(!showToken)}
                tabIndex={-1}
              >
                {showToken ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Enter Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}

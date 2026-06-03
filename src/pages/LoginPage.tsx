import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    if (localStorage.getItem('github_token')) navigate('/panel', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' },
      });
      if (res.status === 401) { setError('Invalid token'); return; }
      if (!res.ok) { setError('Connection error, try again'); return; }
      const data = await res.json();
      localStorage.setItem('github_token', token);
      localStorage.setItem('github_username', data.login);
      addToast('Logged in successfully', 'success');
      navigate('/panel', { replace: true });
    } catch { setError('Connection error, try again'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-background">
      <Card className="w-full max-w-sm neon-glow">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">VPN Panel</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Enter your GitHub token</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                placeholder="GitHub Personal Access Token"
                value={token}
                onChange={e => setToken(e.target.value)}
                required
                autoFocus
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-1"
                onClick={() => setShowToken(!showToken)}
                tabIndex={-1}
              >
                {showToken ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Enter Panel'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

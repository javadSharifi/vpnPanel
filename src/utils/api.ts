type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'info'): void {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
}

export async function apiCall(url: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('github_token');
  const hasBody = options.method && options.method !== 'GET' && options.method !== 'DELETE';
  const headers: Record<string, string> = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_username');
    showToast('Session expired. Please log in again.', 'error');
    setTimeout(() => {
      window.location.hash = '#/';
      window.location.reload();
    }, 500);
    throw new Error('Unauthorized');
  }

  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    if (body.message && body.message.includes('Resource not accessible')) {
      showToast('GitHub token lacks Gist permission. Create a classic token with "gist" scope.', 'error');
      throw new Error('Token lacks gist scope');
    }
    showToast('GitHub API rate limit reached. Try again later.', 'error');
    throw new Error('Rate limited');
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

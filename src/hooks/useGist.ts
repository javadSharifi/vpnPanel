import { useCallback } from 'react';
import { apiCall } from '../utils/api';

export interface Customer {
  id: string;
  description: string;
  updatedAt: string;
  filename: string;
  customerSlug: string;
  rawUrl: string;
}

export interface UseGistReturn {
  listGists: () => Promise<Customer[]>;
  createGist: (description: string, filename: string, content: string) => Promise<any>;
  updateGist: (gistId: string, description: string, oldSlug: string, newSlug: string, content: string) => Promise<any>;
  deleteGist: (gistId: string) => Promise<void>;
  getGistContent: (gistId: string, filename: string) => Promise<string>;
  getGistPublic: (gistId: string) => Promise<any>;
}

export function useGist(): UseGistReturn {
  function buildRawUrl(gistId: string, filename: string): string {
    const username = localStorage.getItem('github_username');
    if (!username) throw new Error('GitHub username not found. Please log in again.');
    return `https://gist.githubusercontent.com/${username}/${gistId}/raw/${filename}`;
  }

  const listGists = useCallback(async (): Promise<Customer[]> => {
    const data = await apiCall(`https://api.github.com/gists?per_page=100&_=${Date.now()}`);
    return data
      .filter((gist: any) => Object.keys(gist.files).some((f: string) => f.startsWith('sub_')))
      .map((gist: any) => {
        const filename = Object.keys(gist.files).find((f: string) => f.startsWith('sub_'))!;
        const customerSlug = filename.replace('sub_', '').replace('.txt', '');
        return {
          id: gist.id,
          description: gist.description || '',
          updatedAt: gist.updated_at,
          filename,
          customerSlug,
          rawUrl: buildRawUrl(gist.id, filename),
        };
      });
  }, []);

  const createGist = useCallback(async (description: string, filename: string, content: string): Promise<any> => {
    return apiCall('https://api.github.com/gists', {
      method: 'POST',
      body: JSON.stringify({
        description,
        public: false,
        files: { [filename]: { content } },
      }),
    });
  }, []);

  const updateGist = useCallback(async (
    gistId: string,
    description: string,
    oldSlug: string,
    newSlug: string,
    content: string,
  ): Promise<any> => {
    const files: Record<string, any> = {};
    if (oldSlug !== newSlug) {
      files[`sub_${oldSlug}.txt`] = null;
      files[`sub_${newSlug}.txt`] = { content };
    } else {
      files[`sub_${newSlug}.txt`] = { content };
    }
    return apiCall(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      body: JSON.stringify({ description, files }),
    });
  }, []);

  const deleteGist = useCallback(async (gistId: string): Promise<void> => {
    await apiCall(`https://api.github.com/gists/${gistId}`, {
      method: 'DELETE',
    });
  }, []);

  const getGistContent = useCallback(async (gistId: string, filename: string): Promise<string> => {
    const data = await apiCall(`https://api.github.com/gists/${gistId}`);
    const file = data.files[filename];
    if (!file) throw new Error('File not found in gist');
    return file.content;
  }, []);

  const getGistPublic = useCallback(async (gistId: string): Promise<any> => {
    const response = await fetch(`https://api.github.com/gists/${gistId}`);
    if (!response.ok) throw new Error('Gist not found');
    return response.json();
  }, []);

  return { listGists, createGist, updateGist, deleteGist, getGistContent, getGistPublic };
}

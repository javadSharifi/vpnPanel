export function encodeContent(text: string, useBase64: boolean): string {
  if (useBase64) {
    return btoa(unescape(encodeURIComponent(text)));
  }
  return text;
}

export function decodeContent(content: string): string {
  try {
    const decoded = decodeURIComponent(escape(atob(content)));
    return decoded;
  } catch {
    return content;
  }
}

export function detectEncoding(content: string): { isBase64: boolean; content: string } {
  try {
    const decoded = decodeURIComponent(escape(atob(content)));
    if (decoded.includes('://')) {
      return { isBase64: true, content: decoded };
    }
  } catch {}
  return { isBase64: false, content };
}

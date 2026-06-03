export function extractIpsFromConfig(text: string): string[] {
  const ips = new Set<string>();
  const ipv4Regex = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g;
  let match: RegExpExecArray | null;

  while ((match = ipv4Regex.exec(text)) !== null) {
    const parts = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseInt(match[4])];
    if (parts.every(p => p >= 0 && p <= 255)) {
      ips.add(match[0]);
    }
  }

  return Array.from(ips);
}

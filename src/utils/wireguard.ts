export function convertWireguardToLink(wgConfig: string, name: string): string {
  const get = (key: string): string =>
    wgConfig.match(new RegExp(key + '\\s*=\\s*([^\\s\\n]+)'))?.[1] || '';
  const privateKey = get('PrivateKey');
  const address = get('Address');
  const dns = (wgConfig.match(/DNS\s*=\s*([^\n]+)/)?.[1] || '').trim().replace(/\s+/g, '');
  const publicKey = get('PublicKey');
  const endpoint = get('Endpoint');
  const allowedIps = (wgConfig.match(/AllowedIPs\s*=\s*([^\n]+)/)?.[1] || '0.0.0.0/0').trim().replace(/\s+/g, '');

  return `wireguard://${encodeURIComponent(privateKey)}@${endpoint}`
    + `?address=${encodeURIComponent(address)}`
    + `&dns=${encodeURIComponent(dns)}`
    + `&publickey=${encodeURIComponent(publicKey)}`
    + `&allowedips=${encodeURIComponent(allowedIps)}`
    + `#${encodeURIComponent(name)}`;
}

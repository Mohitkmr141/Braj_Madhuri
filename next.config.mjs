import os from 'os';

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dynamically allow all current local IPs to prevent HMR errors
  allowedDevOrigins: [...getLocalIPs(), '192.168.1.20', '192.168.26.91'],
};

export default nextConfig;

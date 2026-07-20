/** @type {import('next').NextConfig} */
const nextConfig = {};

// Only set allowedDevOrigins in development to prevent HMR errors
if (process.env.NODE_ENV === 'development') {
  const os = await import('os');

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

  nextConfig.allowedDevOrigins = [...getLocalIPs(), '192.168.1.20', '192.168.26.91'];
}

export default nextConfig;

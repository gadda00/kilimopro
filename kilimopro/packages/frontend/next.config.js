/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The data layer uses fetch() to call external APIs (FAOSTAT, Open-Meteo, ICPAC, World Bank)
  // These are all server-side calls from API routes — no env vars needed for data sources
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

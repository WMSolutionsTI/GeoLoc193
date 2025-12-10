module.exports = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'app.cbi1.org', 'sos193.org'],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'app.cbi1.org' }],
        destination: '/login',
        permanent: false,
      },
      {
        source: '/',
        has: [{ type: 'host', value: 'sos193.org' }],
        destination: '/acessar',
        permanent: false,
      },
    ]
  },
};

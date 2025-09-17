/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://js.stripe.com https://m.stripe.network",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https://lh3.googleusercontent.com https://oaidalleapiprodscus.blob.core.windows.net",
              "connect-src 'self' https://api.openai.com https://accounts.google.com",
              "font-src 'self'",
              "frame-src 'self' https://accounts.google.com https://js.stripe.com https://m.stripe.network https://is.stripe.com"
            ].join('; ')
          }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        port: '',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
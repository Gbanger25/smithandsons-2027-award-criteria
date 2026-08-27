/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // The vote and admin server code reads public/offices.txt at runtime to
  // validate submissions. Files under public/ are CDN assets and aren't traced
  // into the server bundle by default, so include it explicitly.
  outputFileTracingIncludes: {
    '/vote/**': ['./public/offices.txt'],
    '/awards/**': ['./public/offices.txt'],
    '/admin': ['./public/offices.txt'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Moderation and the ballot are state-changing surfaces.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}

export default nextConfig

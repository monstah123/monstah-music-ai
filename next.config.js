/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['replicate.delivery', 'replicate.com', 'pbxt.replicate.delivery'],
  },
  experimental: {
    serverComponentsExternalPackages: ['replicate'],
  },
}

module.exports = nextConfig

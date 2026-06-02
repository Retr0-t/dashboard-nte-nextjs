/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['jspdf', 'html2canvas'],
  },
}
module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // jspdf & html2canvas hanya dipakai di browser via dynamic import
  // tidak perlu serverComponentsExternalPackages
}
module.exports = nextConfig

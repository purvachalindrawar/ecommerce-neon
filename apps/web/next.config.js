/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { appDir: false }, // <- force Pages Router only
  reactStrictMode: true,
};
module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['mssql', 'msnodesqlv8'],
  env: {
    APP_ENV: process.env.env || '',
  }
};

export default nextConfig;


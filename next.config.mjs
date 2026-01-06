/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['mssql', 'msnodesqlv8'],
};

export default nextConfig;

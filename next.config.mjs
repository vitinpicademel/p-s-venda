/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // Desabilita static optimization para páginas que usam Supabase
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;


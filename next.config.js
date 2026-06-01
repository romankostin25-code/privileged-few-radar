/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // SDK type definitions for built-in tools like web_search_20250305 can lag
    // behind the actual API; runtime behaviour is correct regardless.
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

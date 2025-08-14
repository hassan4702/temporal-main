/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // App Router is now stable in Next.js 15, no experimental config needed
}

module.exports = nextConfig

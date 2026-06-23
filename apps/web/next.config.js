const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  webpack: (config) => {
    config.resolve.alias['@churchos/shared-types'] = path.resolve(__dirname, '../../packages/shared-types/src/index.ts')
    config.resolve.alias['@churchos/state-machine'] = path.resolve(__dirname, '../../packages/state-machine/src/index.ts')
    config.resolve.alias['@churchos/bible-engine'] = path.resolve(__dirname, '../../packages/bible-engine/src/index.ts')
    return config
  },
}
module.exports = nextConfig

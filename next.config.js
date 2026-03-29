/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, net: false, tls: false, child_process: false,
      };
    }
    // Ignore test files from any package that import Deno/std modules
    config.plugins.push(
      new (require('webpack').IgnorePlugin)({
        resourceRegExp: /^@std\/testing/,
      })
    );
    return config;
  },
};

module.exports = nextConfig;

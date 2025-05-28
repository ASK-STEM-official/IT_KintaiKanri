/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 本番ビルド時のみESLintのエラーを無視
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 本番ビルド時のみTypeScriptのエラーを無視
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 
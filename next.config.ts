import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  webpack: config => {
    // LangChain用の設定
    return config
  },
  // 環境変数をクライアントに公開する場合
  env: {
    // 例: OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
}

export default nextConfig

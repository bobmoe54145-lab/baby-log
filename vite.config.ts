import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // ホーム画面に追加できるアプリ（PWA）にする設定
    VitePWA({
      // 新しい版を公開したら、次に開いたときに自動で切り替える
      registerType: 'autoUpdate',
      // アプリ本体を iPhone の中に保存しておき、電波がなくても開けるようにする
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
      includeAssets: ['favicon.svg', 'icons/icon-180.png'],
      manifest: {
        name: '育児記録',
        short_name: '育児記録',
        description: '赤ちゃんのお世話の記録と予防接種・成長曲線を管理する自分用アプリ',
        lang: 'ja',
        start_url: '/',
        display: 'standalone',
        background_color: '#f7f5f2',
        theme_color: '#f7f5f2',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})

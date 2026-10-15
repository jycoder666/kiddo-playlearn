import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    // 监听所有网卡，局域网 / 端口映射后的外网都能进
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // 隧道域名、公网 IP 访问时不要被 Vite 拦 Host
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
})

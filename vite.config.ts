import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Set BASE_PATH=/repository-name/ for GitHub Pages project sites.
export default defineConfig({
  plugins: [vue()],
  base: process.env.BASE_PATH || '/',
})

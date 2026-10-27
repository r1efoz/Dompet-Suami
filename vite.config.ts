import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, build } from 'vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main.ts')
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  }
})

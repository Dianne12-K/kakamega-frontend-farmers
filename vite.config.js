// import { defineConfig } from 'vite'
// import tailwindcss from '@tailwindcss/vite'
// import vue from '@vitejs/plugin-vue'
//
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [vue(),
//       tailwindcss()
//   ],
// })
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        port: 5200,
        strictPort: false,
        hmr: {
            protocol: 'ws',
            host: 'localhost'
        },
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            }
        }
    }
})
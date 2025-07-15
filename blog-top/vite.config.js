import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:443',
        secure: false,
      },
       '/uploads': {
        target: 'https://localhost:443',
        // changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
});


import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
    server: {
    // https: {
    //   // key: fs.readFileSync(path.resolve(__dirname, '../localhost-key.pem')),
    //   // cert: fs.readFileSync(path.resolve(__dirname, '../localhost-cert.pem')),
    // },
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:443',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://localhost:443',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
});

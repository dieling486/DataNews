import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/DataNews/', // 必须和你的仓库名完全一致，区分大小写
}); 
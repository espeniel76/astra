import { defineConfig } from 'vite';

// --mode app: 안드로이드 앱(app/)에 넣을 빌드. 개발자 미리보기(dev.html)는 빼고 게임만
export default defineConfig(({ mode }) => ({
  base: './',
  server: { host: '0.0.0.0', port: 5190, strictPort: true, watch: { ignored: ['**/shots/**', '**/.superpowers/**'] } },
  build: {
    target: 'es2022',
    // Phaser는 따로 떼어 둔다: 게임만 고쳐 올려도 Phaser는 다시 받지 않는다
    // dev.html = 개발자 미리보기(게임과 같은 곳에 올라가지만 링크는 따로)
    rollupOptions: { input: mode === 'app' ? { main: 'index.html' } : { main: 'index.html', dev: 'dev.html' }, output: { manualChunks: { phaser: ['phaser'] } } },
    chunkSizeWarningLimit: 1300,
  },
}));

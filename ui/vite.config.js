import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import Components from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  plugins: [
    vue(),
    Components({
      resolvers: [AntDesignVueResolver()],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/yun": {
        target: "https://x.580u.com",
        changeOrigin: true,
      },
    },
  },
  build: {
    // outDir: '../javascript',
    // assetsDir: '../',
    minify: true,
    sourcemap: true,
    watch: {
      // https://rollupjs.org/configuration-options/#watch
    },
    lib: {
      entry: resolve(__dirname, "src/entry.js"),
      name: "sd-webui-iiooo-tag",
      formats: ["umd"],
    },
    rollupOptions: {
      plugins: [],
      output: {
        globals: {},
        name: "sd-webui-iiooo-tag",
        dir: "../", // 对于多文件构建，指定文件夹输出路径
        format: "umd",
        chunkFileNames: "javascript/[name].chunk.js", // 指定 chunk 文件名称
        entryFileNames: "javascript/[name].entry.js", // 指定入口文件名称
        assetFileNames: "style.[ext]",
      },
    },
  },
});

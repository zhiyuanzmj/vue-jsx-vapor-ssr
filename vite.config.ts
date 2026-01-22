import { defineConfig } from 'vite'
import vueJsxVapor from 'vue-jsx-vapor/vite'

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => {
  return {
    resolve: {
      alias: {
        ...isSsrBuild || process.env.SSR ? {
          "vue/server-renderer": "vue/server-renderer",
          // Since @vue/runtime-vapor is not bundle in cjs, so use esm instead.
          vue: "vue/dist/vue.runtime-with-vapor.esm-browser.js",
        } : {}
      },
    },
    plugins: [
      vueJsxVapor({ macros: true, interop: true })
    ],
  }
})

import { defineConfig } from 'vite'
import vueJsxVapor from 'vue-jsx-vapor/vite'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      vueJsxVapor({
        macros: true,
        interop: true,
        compiler: { runtimeModuleName: 'vue-jsx-vapor' }
      })
    ],
  }
})

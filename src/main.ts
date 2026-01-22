import { createApp as _createApp, createVaporApp } from 'vue'
import App from './App'

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp() {
  const app = createVaporApp(App)
  return { app }
}

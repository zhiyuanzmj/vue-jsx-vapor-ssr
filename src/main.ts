import * as Vue from 'vue'
import App from './App'

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp(ssr = false) {
  const app = (ssr ? Vue.createApp : Vue.createVaporApp)(App as any)
  return { app }
}

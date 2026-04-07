import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration file for setting up plugins and build options.
// See https://vite.dev/config/ for full documentation.
export default defineConfig({
  plugins: [react()],
})

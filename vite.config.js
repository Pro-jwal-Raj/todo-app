import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 50000,
          groups: [
            {
              name: "vendor-charts",
              test: /recharts|d3/,
            },
            {
              name: "vendor-dnd",
              test: /@dnd-kit/,
            },
          ],
        },
      },
    },
  },
})

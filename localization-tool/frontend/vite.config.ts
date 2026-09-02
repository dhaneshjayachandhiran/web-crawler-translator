import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import postcss from "postcss"

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
})
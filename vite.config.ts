import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";
  const isProduction = mode === "production";

  return {
    plugins: [react(), tsconfigPaths(), tailwindcss()],
    build: {
      sourcemap: isDevelopment,
      cssMinify: isProduction,
      minify: isProduction ? "esbuild" : false,
    },
  };
});

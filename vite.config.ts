import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";
  const isProduction = mode === "production";

  return {
    plugins: [react(), tsconfigPaths(), tailwindcss(), visualizer()],
    build: {
      sourcemap: isDevelopment,
      cssMinify: isProduction,
      minify: isProduction ? "esbuild" : false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              const arr = id.toString().split("node_modules/")[1].split("/");

              const pkgName = arr[1].startsWith("@")
                ? arr[1].split("@")[1]
                : arr[1].split("@")[0];

              if (
                pkgName.startsWith("react") ||
                pkgName.startsWith("heroui") ||
                pkgName.startsWith("heroicons") ||
                pkgName.startsWith("tanstack") || // Hero UI table dependencies
                pkgName.startsWith("framer-motion") // Hero UI animation dependencies
              )
                return "framework";

              return "vendor";
            }
          },
        },
      },
    },
  };
});

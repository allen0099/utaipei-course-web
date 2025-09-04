import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";
  const isProduction = mode === "production";

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      tailwindcss(),
      viteCompression({
        threshold: 50000, // 50kb
      }),
    ],
    build: {
      sourcemap: isDevelopment,
      cssMinify: isProduction,
      minify: isProduction ? "esbuild" : false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              const arr = id.toString().split("node_modules/")[1].split("/");

              const pkgName = arr[1].startsWith("@")
                ? arr[1].split("@")[1]
                : arr[1].split("@")[0];

              if (
                pkgName === "react" ||
                pkgName === "react-dom" ||
                pkgName === "react-router-dom" ||
                pkgName === "react-stately"
              ) {
                return "rdd";
              }

              if (pkgName.startsWith("react-aria")) {
                return "raa";
              }
              if (pkgName.startsWith("react")) {
                return "rea";
              }

              if (pkgName.startsWith("heroui")) {
                return "hui";
              }

              return;
            }
          },
        },
      },
    },
  };
});

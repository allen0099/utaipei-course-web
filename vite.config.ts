import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";
  const isProduction = mode === "production";

  return {
    plugins: [react(), tailwindcss(), visualizer()],
    resolve: {
      tsconfigPaths: true,
    },
    build: {
      sourcemap: isDevelopment,
      cssMinify: isProduction,
      minify: isProduction ? "esbuild" : false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              // pnpm nests real packages under `.pnpm/<name>@<version>_<hash>/
              // node_modules/<name>/...`, so split on the LAST
              // "node_modules/" segment to get the actual package path
              // rather than the pnpm store folder name (otherwise e.g.
              // "react-pdf@10.4.1_..." would match the "react" prefix check
              // below and get pulled into the eagerly-loaded framework
              // chunk instead of its own lazily-loaded chunk).
              const parts = id.toString().split("node_modules/");
              const arr = parts[parts.length - 1].split("/");

              const pkgName = arr[0].startsWith("@")
                ? `${arr[0]}/${arr[1]}`
                : arr[0];

              // These heavy, page-specific dependencies are lazy-loaded via
              // React.lazy()/dynamic import() (react-pdf + pdfjs-dist for
              // the calendar/timetable pages, html-to-image for schedule
              // image export) and must stay out of the framework/vendor
              // chunks so they get their own on-demand chunk.
              if (
                pkgName === "react-pdf" ||
                pkgName === "pdfjs-dist" ||
                pkgName === "html-to-image"
              )
                return undefined;

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

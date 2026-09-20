import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

// 爬蟲發佈資料的位置，與 src/config/site.ts 的 links.github.api 是同一個來源。
//
// 必須是 RegExp 而不是函式：workbox 會把 urlPattern 原樣「印」進 sw.js，函式
// 裡引用到的外部變數在那邊並不存在，比對時直接 ReferenceError —— 結果是什麼都
// 不快取，而且不會有任何錯誤訊息。
const DATA_JSON =
  /^https:\/\/allen0099\.github\.io\/utaipei-course-crawler\/.*\.json$/;
const DATA_PDF =
  /^https:\/\/allen0099\.github\.io\/utaipei-course-crawler\/.*\.pdf$/;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";
  const isProduction = mode === "production";

  return {
    plugins: [
      react(),
      tailwindcss(),
      visualizer(),
      // 之前只有 site.webmanifest、沒有 service worker：能「加到主畫面」，但
      // 一離線就是瀏覽器的恐龍頁。教室在地下室、通勤在捷運上，正是會想看課表
      // 的時候。
      VitePWA({
        // manifest 是 scripts/generate-brand-assets.js 產的 public/site.webmanifest，
        // index.html 已經連好了；這裡只要 service worker。
        manifest: false,
        injectRegister: "auto",
        // 新版一部署，下次造訪就換上去。選課資訊放舊版沒有任何好處，而這個站
        // 沒有「填到一半的表單」這種會被重新整理弄丟的狀態（課表在
        // localStorage）。
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,mjs}"],
          // OG 分享圖是給爬蟲看的，使用者的瀏覽器永遠用不到，合計 500KB 以上。
          globIgnores: ["og/**", "404.html", "stats.html"],
          // pdf.js worker 超過預設的 2MB 上限。
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          // GitHub Pages 沒有 SPA rewrite；離線時任何路由都回 app shell，由
          // React Router 接手。線上時 SW 也會先回這份，所以每條路由預先產生
          // 的 meta 只有爬蟲（不跑 SW）看得到 —— 那正是它們的用途。
          navigateFallback: "/index.html",
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // 課程／行事曆 JSON。NetworkFirst：有網路時行為跟以前一模一樣
              // （永遠拿最新的），只有連不上或太慢時才退回上次抓到的那份。
              // 不用 StaleWhileRevalidate —— 它會先回舊資料，而「目前學年期
              // 是哪一個」這種事拿到舊答案會直接影響能不能加課。
              urlPattern: DATA_JSON,
              handler: "NetworkFirst",
              options: {
                cacheName: "course-data",
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: { statuses: [200] },
              },
            },
            {
              // 行事曆 PDF 發佈後不會變，抓過就留著。
              urlPattern: DATA_PDF,
              handler: "CacheFirst",
              options: {
                cacheName: "calendar-pdf",
                expiration: {
                  maxEntries: 12,
                  maxAgeSeconds: 60 * 60 * 24 * 90,
                },
                cacheableResponse: { statuses: [200] },
              },
            },
          ],
        },
      }),
    ],
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

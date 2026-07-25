#!/usr/bin/env node

/**
 * 產生 public/ 底下所有品牌圖檔：favicon 全套、PWA 圖示、site.webmanifest，
 * 以及每條路由一張的 OG 分享圖。
 *
 * 這支不接在 build 流程上——產物是會進版控的靜態檔，只有在改了 scripts/brand/
 * 的原稿或 page-meta.js 的文案時才需要手動重跑（pnpm run generate-brand）。
 *
 * 字型走系統安裝的繁體中文字型（Windows 的微軟正黑體 / Noto Sans TC）。機器上
 * 沒有這些字型時 resvg 會靜靜地畫出空白方塊，所以下面會先確認字型抓得到。
 */

import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { Resvg } from "@resvg/resvg-js";

import { SITE, defaultMeta, pageMeta } from "../src/config/page-meta.js";
import { markFullBleed, markSquircle } from "./brand/mark.js";
import { OG_HEIGHT, OG_WIDTH, ogImage } from "./brand/og.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "../public");

/** 單張 OG 圖的上限。GitHub Pages 是純靜態，沒有圖片最佳化層可以幫忙。 */
const OG_SIZE_LIMIT = 300 * 1024;

const resvgOptions = {
  font: { loadSystemFonts: true, defaultFontFamily: "Microsoft JhengHei" },
};

function render(svg, width) {
  return new Resvg(svg, {
    ...resvgOptions,
    fitTo: { mode: "width", value: width },
  })
    .render()
    .asPng();
}

function write(relativePath, contents) {
  const target = join(PUBLIC_DIR, relativePath);

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);

  const kb = (statSync(target).size / 1024).toFixed(1);

  console.log(`✅ public/${relativePath} (${kb} KB)`);

  return statSync(target).size;
}

/**
 * 把數張 PNG 打包成 .ico。ICONDIR(6) + 每張 ICONDIRENTRY(16) + 影像資料，
 * 影像直接內嵌 PNG（Vista 之後的 Windows 與所有現代瀏覽器都讀得懂），
 * 省掉自己編 BMP 還要補 AND mask 的麻煩。
 *
 * @param {{ size: number, png: Buffer }[]} images
 */
function buildIco(images) {
  const header = Buffer.alloc(6);

  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;

  images.forEach(({ size, png }, index) => {
    const at = index * 16;
    // 256 要寫成 0；這裡最大只到 48，不過留著免得之後加大尺寸踩到。
    const dimension = size >= 256 ? 0 : size;

    directory.writeUInt8(dimension, at);
    directory.writeUInt8(dimension, at + 1);
    directory.writeUInt8(0, at + 2); // 調色盤色數：真彩色填 0
    directory.writeUInt8(0, at + 3); // reserved
    directory.writeUInt16LE(1, at + 4); // colour planes
    directory.writeUInt16LE(32, at + 6); // bits per pixel
    directory.writeUInt32LE(png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });

  return Buffer.concat([header, directory, ...images.map((i) => i.png)]);
}

/**
 * resvg 找不到中文字型時不會報錯，只會畫出一片空白，那種圖直到貼進聊天室才會
 * 被發現。先渲染一個中文字，確認它真的有畫出東西。
 */
function assertFontsAvailable() {
  const probe = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><text x="0" y="48" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="48" fill="#000">課</text></svg>`;
  const pixels = new Resvg(probe, resvgOptions).render().pixels;

  let inked = 0;

  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] > 0) inked += 1;
  }

  if (inked < 100) {
    console.error(
      "❌ 系統找不到可用的繁體中文字型，OG 圖上的文字會是空白。",
    );
    console.error(
      "   請安裝 Noto Sans TC（或在 Windows 上使用內建的微軟正黑體）後重跑。",
    );
    process.exit(1);
  }
}

function generateIcons() {
  console.log("\n🎨 圖示");

  // 向量版：瀏覽器分頁、以及任何吃 SVG icon 的地方。
  write("favicon.svg", `${markSquircle({ size: null })}\n`);

  const squircle = markSquircle();
  const icoSizes = [16, 32, 48];

  write(
    "favicon.ico",
    buildIco(icoSizes.map((size) => ({ size, png: render(squircle, size) }))),
  );

  // iOS 不支援透明背景，會把透明處填成黑色，所以用滿版的版本。
  write("apple-touch-icon.png", render(markFullBleed({ inset: 0.8 }), 180));

  write("icon-192.png", render(squircle, 192));
  write("icon-512.png", render(squircle, 512));
  // maskable 的安全區是置中、直徑 80% 的圓，內容縮到 0.72 才不會被裁到耳朵。
  write("icon-512-maskable.png", render(markFullBleed({ inset: 0.72 }), 512));

  write(
    "site.webmanifest",
    `${JSON.stringify(
      {
        name: SITE.name,
        short_name: SITE.shortName,
        description: defaultMeta.description,
        lang: SITE.locale,
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#ea580c",
        background_color: "#ffffff",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
}

function generateOgImages() {
  console.log("\n🖼️  OG 分享圖");

  // 舊的圖先清掉，路由改名時才不會留下沒人引用的孤兒檔。
  try {
    rmSync(join(PUBLIC_DIR, "og"), { recursive: true });
  } catch {
    // 還沒產生過，正常。
  }

  const domain = SITE.baseUrl.replace(/^https?:\/\//, "");
  let oversized = 0;

  for (const [route, meta] of Object.entries(pageMeta)) {
    if (!meta.ogImage.startsWith("/og/")) {
      console.error(`❌ ${route} 的 ogImage 不在 /og/ 底下：${meta.ogImage}`);
      process.exit(1);
    }

    const isHome = route === "/";
    const svg = ogImage({
      // 首頁的 name 是導覽用的「首頁」，貼到分享圖上沒有意義，改用品牌全名。
      title: isHome ? SITE.name : meta.name,
      description: meta.description,
      // 標題已經是品牌名的首頁，眉標改講學校，省得同一句話出現兩次。
      eyebrow: isHome ? "臺北市立大學選課工具" : SITE.name,
      domain,
    });

    const bytes = write(
      meta.ogImage.replace(/^\//, ""),
      new Resvg(svg, resvgOptions).render().asPng(),
    );

    if (bytes > OG_SIZE_LIMIT) oversized += 1;
  }

  if (oversized > 0) {
    console.error(`❌ 有 ${oversized} 張 OG 圖超過 ${OG_SIZE_LIMIT / 1024}KB。`);
    process.exit(1);
  }

  console.log(`   尺寸 ${OG_WIDTH}×${OG_HEIGHT}`);
}

assertFontsAvailable();
generateIcons();
generateOgImages();

const total = readdirSync(join(PUBLIC_DIR, "og")).reduce(
  (sum, file) => sum + statSync(join(PUBLIC_DIR, "og", file)).size,
  0,
);

console.log(`\n🎉 完成，public/og 合計 ${(total / 1024).toFixed(0)} KB。`);

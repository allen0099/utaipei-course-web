#!/usr/bin/env node

/**
 * Generate static HTML pages with proper meta tags for social media crawlers
 * This script creates route-specific HTML files with pre-rendered OG tags
 * so crawlers don't need to execute JavaScript to see the proper meta information.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 路由表與 app runtime（src/config/meta.ts）共用同一份純 .js 資料，兩邊不會漂移。
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE,
  buildJsonLd,
  canonicalUrl,
  pageMeta,
} from '../src/config/page-meta.js';
import { HOME_FAQ } from '../src/config/home-faq.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** 這些字串會被直接塞進 content="…"，一個引號就足以拆掉整個標籤。 */
function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateMetaTags(route, routeMeta) {
  const fullUrl = canonicalUrl(route);
  const fullOgImage = `${SITE.baseUrl}${routeMeta.ogImage || SITE.ogImage}`;

  const robotsTag = routeMeta.noIndex
    ? `
    <!-- No index for robots -->
    <meta name="robots" content="noindex,nofollow" />
`
    : '';

  const jsonLd = buildJsonLd(route);
  // `<` 轉成跳脫序列，任何一段資料裡的 "</script>" 才不會提早關掉這個標籤。
  const jsonLdTag = jsonLd
    ? `

    <!-- Structured data -->
    <script id="seo-jsonld" type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
    : '';

  return `${robotsTag}
    <!-- Basic meta tags -->
    <meta name="description" content="${escapeAttr(routeMeta.description)}" />
    <meta name="author" content="${escapeAttr(SITE.name)}" />

    <!-- Open Graph meta tags -->
    <meta property="og:title" content="${escapeAttr(routeMeta.title)}" />
    <meta property="og:description" content="${escapeAttr(routeMeta.description)}" />
    <meta property="og:type" content="${escapeAttr(routeMeta.ogType || 'website')}" />
    <meta property="og:url" content="${escapeAttr(fullUrl)}" />
    <meta property="og:site_name" content="${escapeAttr(SITE.name)}" />
    <meta property="og:locale" content="${escapeAttr(SITE.ogLocale)}" />
    <meta property="og:image" content="${escapeAttr(fullOgImage)}" />
    <meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />
    <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />
    <meta property="og:image:alt" content="${escapeAttr(routeMeta.ogImageAlt || SITE.ogImageAlt)}" />

    <!-- Twitter Card meta tags -->
    <!-- 分享圖是 1200×630 的大圖版型，用 summary 會被裁成小方塊。 -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(routeMeta.title)}" />
    <meta name="twitter:description" content="${escapeAttr(routeMeta.description)}" />
    <meta name="twitter:image" content="${escapeAttr(fullOgImage)}" />

    <!-- Canonical URL -->
    <link rel="canonical" href="${escapeAttr(fullUrl)}" />${jsonLdTag}`;
}

/**
 * 寫進 <div id="root"> 的靜態內容：站名、全站導覽、該頁的 <h1> 與說明，首頁再加
 * 上常見問題。
 *
 * 以前 #root 是空的，沒執行 JS 的爬蟲在每一頁只讀得到 GTM 的 noscript，Search
 * Console 也一直停在「已檢索 - 目前未建立索引」。這裡放的只是 React 渲染後本來
 * 就會出現的文字的子集（同樣的 h1、同一句 description、同一份 HOME_FAQ），不是
 * 另一套只給爬蟲看的內容。createRoot().render() 第一次渲染時會清空 #root，所以
 * 使用者只會在 JS 載入前短暫看到它。
 *
 * 樣式寫在這段 HTML 自己的 <style> 裡：Tailwind 不保證掃得到 scripts/，而這段
 * <style> 會跟著 #root 的內容一起被 React 換掉，不會漏到 app 裡。
 */
function generateRootContent(route, routeMeta) {
  const isHome = route === '/';
  const heading = isHome ? SITE.shortName : routeMeta.name;

  const navLinks = Object.entries(pageMeta)
    .filter(([, meta]) => !meta.noIndex)
    .map(([path, meta]) => {
      const href = path === '/' ? '/' : `${path}/`;
      const current = path === route ? ' aria-current="page"' : '';

      return `<li><a href="${escapeAttr(href)}"${current}>${escapeAttr(meta.name)}</a></li>`;
    })
    .join('');

  const faq = isHome
    ? `<section><h2>常見問題</h2>${HOME_FAQ.map(
        (item) =>
          `<details><summary>${escapeAttr(item.q)}</summary><p>${escapeAttr(item.a)}</p></details>`,
      ).join('')}</section>`
    : '';

  return `<div class="prerender"><style>.prerender{max-width:56rem;margin:0 auto;padding:1.5rem 1rem;font-family:system-ui,sans-serif;line-height:1.7}.prerender nav ul{display:flex;flex-wrap:wrap;gap:.25rem 1rem;list-style:none;padding:0;margin:.5rem 0 1.5rem}.prerender a{color:inherit}.prerender h1{font-size:1.75rem;margin:0 0 .5rem}.prerender h2{font-size:1.25rem;margin:2rem 0 .5rem}.prerender summary{cursor:pointer;font-weight:600;margin-top:.75rem}</style><header><a href="/">${escapeAttr(SITE.name)}</a></header><nav aria-label="網站導覽"><ul>${navLinks}</ul></nav><main><h1>${escapeAttr(heading)}</h1><p>${escapeAttr(routeMeta.description)}</p>${faq}</main><noscript><p>本站需要啟用 JavaScript 才能使用完整功能。</p></noscript></div>`;
}

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const urlEntries = Object.entries(pageMeta)
    // A noIndex route asks crawlers to stay away; listing it in the sitemap
    // would be inviting them in through the other door.
    .filter(([, routeMeta]) => !routeMeta.noIndex)
    .map(([route]) => route)
    .map(
      // canonicalUrl() 補上尾斜線，跟頁面裡的 canonical 逐字相同，也避開
      // GitHub Pages 對無尾斜線網址的 301。
      (route) => `  <url>
    <loc>${canonicalUrl(route)}</loc>
    <lastmod>${today}</lastmod>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

function generateStaticPages() {
  console.log('🚀 Generating static HTML pages with pre-rendered meta tags...');

  // Read the built template from dist directory
  const builtTemplatePath = join(__dirname, '../dist/index.html');
  let template;

  try {
    template = readFileSync(builtTemplatePath, 'utf-8');
  } catch (error) {
    console.error('❌ Error reading built template file:', error);
    console.error('Make sure to run this script AFTER vite build has completed.');
    process.exit(1);
  }

  // Create dist directory if it doesn't exist
  const distPath = join(__dirname, '../dist');
  try {
    mkdirSync(distPath, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
  }

  // Generate HTML for each route
  for (const [route, routeMeta] of Object.entries(pageMeta)) {
    const metaTags = generateMetaTags(route, routeMeta);

    // Replace the title and meta section
    let html = template.replace(
      /<title>.*?<\/title>/,
      `<title>${escapeAttr(routeMeta.title)}</title>`
    );

    // Replace the existing meta tags section with route-specific ones.
    //
    // The block is anchored between the "Default meta tags" comment and the
    // theme script that follows it in index.html. A regex is only as good as
    // those anchors, so a miss fails the build instead of silently shipping
    // every route with the site-wide default description and OG tags.
    const metaBlock = /<!-- Default meta tags[\s\S]*?<!-- Apply saved theme/;

    if (!metaBlock.test(html)) {
      console.error(
        '❌ Could not find the default meta tag block in dist/index.html.',
      );
      console.error(
        'The anchors in index.html changed — update the regex in this script.',
      );
      process.exit(1);
    }

    html = html.replace(
      metaBlock,
      `<!-- Route-specific meta tags -->${metaTags}

    <!-- Apply saved theme`
    );

    // Same fail-loud rule as the meta block: if the mount point stops matching,
    // every route silently goes back to shipping an empty body.
    const rootMount = '<div id="root"></div>';

    if (!html.includes(rootMount)) {
      console.error('❌ Could not find <div id="root"></div> in dist/index.html.');
      process.exit(1);
    }

    html = html.replace(
      rootMount,
      `<div id="root">${generateRootContent(route, routeMeta)}</div>`,
    );

    // Determine the file path based on route
    let filePath;
    if (route === '/') {
      filePath = join(distPath, 'index.html');
    } else {
      const routeDir = join(distPath, route);
      mkdirSync(routeDir, { recursive: true });
      filePath = join(routeDir, 'index.html');
    }

    // Write the file
    try {
      writeFileSync(filePath, html, 'utf-8');
      console.log(`✅ Generated: ${filePath}`);
    } catch (error) {
      console.error(`❌ Error writing file ${filePath}:`, error);
      process.exit(1);
    }
  }

  // Generate sitemap.xml from the same route list used for meta tags above,
  // so there is a single source of truth for the site's static routes.
  const sitemapPath = join(distPath, 'sitemap.xml');

  try {
    writeFileSync(sitemapPath, generateSitemap(), 'utf-8');
    console.log(`✅ Generated: ${sitemapPath}`);
  } catch (error) {
    console.error(`❌ Error writing file ${sitemapPath}:`, error);
    process.exit(1);
  }

  console.log('🎉 Static page generation completed!');
  console.log(`📄 Generated ${Object.keys(pageMeta).length} HTML files with pre-rendered meta tags.`);
  console.log('📝 Social media crawlers will now see proper OG information without JavaScript execution.');
}

// Run the script
generateStaticPages();

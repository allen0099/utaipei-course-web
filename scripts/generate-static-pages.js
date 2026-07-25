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
  SITE,
  buildJsonLd,
  canonicalUrl,
  pageMeta,
} from '../src/config/page-meta.js';

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
    <meta property="og:image:alt" content="${escapeAttr(SITE.ogImageAlt)}" />

    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeAttr(routeMeta.title)}" />
    <meta name="twitter:description" content="${escapeAttr(routeMeta.description)}" />
    <meta name="twitter:image" content="${escapeAttr(fullOgImage)}" />

    <!-- Canonical URL -->
    <link rel="canonical" href="${escapeAttr(fullUrl)}" />${jsonLdTag}`;
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

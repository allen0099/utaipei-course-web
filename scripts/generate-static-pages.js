#!/usr/bin/env node

/**
 * Generate static HTML pages with proper meta tags for social media crawlers
 * This script creates route-specific HTML files with pre-rendered OG tags
 * so crawlers don't need to execute JavaScript to see the proper meta information.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Route configurations with meta tags.
//
// This MUST stay in sync with `pageMeta` in src/config/meta.ts, which drives the
// same tags at runtime. This script runs as plain .js under node after `vite build`,
// so it cannot import the .ts module — the table is duplicated on purpose.
// Page <h1>s (the `title` prop on <PageHeader>) and the nav labels in
// src/config/site.ts must use the same name as the title here.
const routes = {
  "/": {
    title: "UTC 選課小幫手",
    description:
      "臺北市立大學選課輔助工具，提供課程查詢、教師課表、校園地圖等功能，讓選課更便利！",
    keywords: "臺北市立大學,選課,課程查詢,教師課表,校園地圖,UTC",
  },
  "/calendar": {
    title: "校園行事曆 - UTC 選課小幫手",
    description:
      "查看臺北市立大學各學年度校園行事曆，掌握學期重要日程，並可下載或訂閱到個人日曆。",
    keywords: "臺北市立大學,行事曆,學期日程,行事曆訂閱,ics,UTC",
  },
  "/search": {
    title: "課程查詢 - UTC 選課小幫手",
    description:
      "依學年度、系所或關鍵字查詢臺北市立大學開課資料，快速找到需要的課程。",
    keywords: "臺北市立大學,課程查詢,課程搜尋,開課資料,選課,UTC",
  },
  "/my-schedule": {
    title: "我的課表 - UTC 選課小幫手",
    description:
      "集中檢視在課程查詢頁勾選的臺北市立大學課程，自動偵測衝堂，並可匯出成日曆或圖片。",
    keywords: "臺北市立大學,我的課表,選課,衝堂偵測,課表匯出,UTC",
  },
  "/share": {
    title: "分享的課表 - UTC 選課小幫手",
    description:
      "檢視別人分享的臺北市立大學課表，確認上課時間與衝堂狀況，也可以一鍵加入自己的課表。",
    keywords: "臺北市立大學,分享課表,課表,選課,UTC",
    // 每條分享連結的內容都不同且只存在於網址片段裡，收錄進搜尋結果沒有意義，
    // 也不該讓某個人的課表被搜到。noIndex 的路由同時會被排除在 sitemap 之外。
    noIndex: true,
  },
  "/schedules/teacher": {
    title: "教師課表 - UTC 選課小幫手",
    description: "查詢臺北市立大學個別教師在該學期的授課課表與上課時間。",
    keywords: "臺北市立大學,教師課表,授課時間,教師查詢,UTC",
  },
  "/schedules/class": {
    title: "班級課表 - UTC 選課小幫手",
    description: "查詢臺北市立大學各班級在該學期的課表。此功能正在建置中。",
    keywords: "臺北市立大學,班級課表,班級查詢,課表,UTC",
  },
  "/schedules/location": {
    // 資料裡不只教室，還有攀岩場地、田徑場、網球場等場地，所以是「地點」不是「教室」。
    title: "地點課表 - UTC 選課小幫手",
    description: "查詢臺北市立大學教室、球場等場地在該學期的使用課表。",
    keywords: "臺北市立大學,地點課表,教室課表,場地查詢,UTC",
  },
  "/map": {
    title: "校園地圖 - UTC 選課小幫手",
    description:
      "臺北市立大學校園地圖，提供各校區大樓代碼對照與樓層平面圖，幫助您快速找到目的地。",
    keywords: "臺北市立大學,校園地圖,大樓代碼,樓層圖,博愛校區,天母校區,UTC",
  },
  "/timetable": {
    title: "校園節次表 - UTC 選課小幫手",
    description: "臺北市立大學二校區上課節次與時間對照表，了解各節次的上下課時間。",
    keywords: "臺北市立大學,校園節次表,上課節次,上課時間,UTC",
  },
};

const siteConfig = {
  name: "UTC 選課小幫手",
  baseUrl: "https://utc.allen0099.tw",
  ogImage: "/CatMeow.png",
};

function generateMetaTags(route, routeMeta) {
  const fullUrl = `${siteConfig.baseUrl}${route}`;
  const fullOgImage = `${siteConfig.baseUrl}${siteConfig.ogImage}`;

  const robotsTag = routeMeta.noIndex
    ? `
    <!-- No index for robots -->
    <meta name="robots" content="noindex,nofollow" />
`
    : '';

  return `${robotsTag}
    <!-- Basic meta tags -->
    <meta name="description" content="${routeMeta.description}" />
    <meta name="keywords" content="${routeMeta.keywords}" />
    <meta name="author" content="UTC 選課小幫手" />
    <meta name="language" content="zh-TW" />

    <!-- Open Graph meta tags -->
    <meta property="og:title" content="${routeMeta.title}" />
    <meta property="og:description" content="${routeMeta.description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:site_name" content="${siteConfig.name}" />
    <meta property="og:image" content="${fullOgImage}" />

    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${routeMeta.title}" />
    <meta name="twitter:description" content="${routeMeta.description}" />
    <meta name="twitter:image" content="${fullOgImage}" />

    <!-- Canonical URL -->
    <link rel="canonical" href="${fullUrl}" />`;
}

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const urlEntries = Object.entries(routes)
    // A noIndex route asks crawlers to stay away; listing it in the sitemap
    // would be inviting them in through the other door.
    .filter(([, routeMeta]) => !routeMeta.noIndex)
    .map(([route]) => route)
    .map(
      (route) => `  <url>
    <loc>${siteConfig.baseUrl}${route}</loc>
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
  for (const [route, routeMeta] of Object.entries(routes)) {
    const metaTags = generateMetaTags(route, routeMeta);
    
    // Replace the title and meta section
    let html = template.replace(
      /<title>.*?<\/title>/,
      `<title>${routeMeta.title}</title>`
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
  console.log(`📄 Generated ${Object.keys(routes).length} HTML files with pre-rendered meta tags.`);
  console.log('📝 Social media crawlers will now see proper OG information without JavaScript execution.');
}

// Run the script
generateStaticPages();
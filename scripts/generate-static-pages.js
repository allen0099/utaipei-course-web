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

// Route configurations with meta tags
const routes = {
  "/": {
    title: "UTC 選課小幫手",
    description:
      "臺北市立大學選課輔助工具，提供課程查詢、教師課表、校園地圖等功能，讓選課更便利！",
    keywords: "臺北市立大學,選課,課程查詢,教師課表,校園地圖,UTC",
  },
  "/calendar": {
    title: "課程行事曆 - UTC 選課小幫手",
    description: "查看臺北市立大學課程行事曆，掌握重要學期日程與課程時間安排。",
    keywords: "臺北市立大學,行事曆,課程時間,學期,UTC",
  },
  "/search": {
    title: "課程查詢 - UTC 選課小幫手",
    description:
      "搜尋臺北市立大學課程資訊，快速找到您需要的課程內容與修課資訊。",
    keywords: "臺北市立大學,課程查詢,課程搜尋,修課,UTC",
  },
  "/schedules/teacher": {
    title: "教師課表 - UTC 選課小幫手",
    description: "查詢臺北市立大學教師課表，了解教師授課時間與課程安排。",
    keywords: "臺北市立大學,教師課表,授課時間,教師查詢,UTC",
  },
  "/schedules/class": {
    title: "系所課表 - UTC 選課小幫手",
    description: "查看臺北市立大學各系所課表，掌握科系課程時間與教室安排。",
    keywords: "臺北市立大學,系所課表,科系課程,教室,UTC",
  },
  "/schedules/location": {
    title: "教室課表 - UTC 選課小幫手",
    description: "查詢臺北市立大學教室使用狀況，了解各教室的課程安排與時間。",
    keywords: "臺北市立大學,教室課表,教室查詢,場地,UTC",
  },
  "/map": {
    title: "校園地圖 - UTC 選課小幫手",
    description:
      "臺北市立大學校園地圖，提供建築物位置與樓層平面圖，幫助您快速找到目的地。",
    keywords: "臺北市立大學,校園地圖,建築物,樓層圖,導航,UTC",
  },
  "/timetable": {
    title: "課程時刻表 - UTC 選課小幫手",
    description: "查看臺北市立大學課程時刻表，了解各節次時間與課程安排。",
    keywords: "臺北市立大學,時刻表,節次時間,課程安排,UTC",
  },
};

const siteConfig = {
  name: "UTC 選課小幫手",
  baseUrl: "https://utc-v2.allen0099.tw",
};

function generateMetaTags(route, routeMeta) {
  const fullUrl = `${siteConfig.baseUrl}${route}`;
  
  return `
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
    
    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${routeMeta.title}" />
    <meta name="twitter:description" content="${routeMeta.description}" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${fullUrl}" />`;
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

    // Replace the existing meta tags section with route-specific ones
    html = html.replace(
      /<!-- Default meta tags[\s\S]*?<!-- Viewport meta tag -->/,
      `<!-- Route-specific meta tags -->${metaTags}
    
    <!-- Viewport meta tag -->`
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

  console.log('🎉 Static page generation completed!');
  console.log(`📄 Generated ${Object.keys(routes).length} HTML files with pre-rendered meta tags.`);
  console.log('📝 Social media crawlers will now see proper OG information without JavaScript execution.');
}

// Run the script
generateStaticPages();
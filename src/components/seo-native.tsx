import { useEffect } from "react";
import { useLocation } from "react-router";

import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE,
  buildJsonLd,
  canonicalUrl,
  getPageMeta,
} from "@/config/meta";

interface SEOProps {
  title?: string;
  description?: string;
  ogType?: string;
  ogImage?: string;
  ogImageAlt?: string;
  noIndex?: boolean;
}

/** 靜態 HTML 與這裡輸出的 JSON-LD 共用同一個 id，換頁時覆寫而不是一直疊上去。 */
const JSON_LD_ID = "seo-jsonld";

export default function SEO({
  title,
  description,
  ogType,
  ogImage,
  ogImageAlt,
  noIndex = false,
}: SEOProps) {
  const location = useLocation();
  const pageMeta = getPageMeta(location.pathname);

  const seoTitle = title || pageMeta.title;
  const seoDescription = description || pageMeta.description;
  const seoOgType = ogType || pageMeta.ogType || "website";
  const seoOgImage = ogImage || pageMeta.ogImage;
  const seoOgImageAlt = ogImageAlt || pageMeta.ogImageAlt || SITE.ogImageAlt;

  useEffect(() => {
    // Update document title
    document.title = seoTitle;

    // GitHub Pages 會把 /search 轉址到 /search/，所以正規網址一律用尾斜線版本；
    // 這裡走的是跟產生靜態 HTML 同一個 canonicalUrl()，兩邊才不會給出不同答案。
    const currentUrl = canonicalUrl(location.pathname);

    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, content: string) => {
      let meta = document.querySelector(selector);

      if (meta) {
        meta.setAttribute("content", content);
      } else {
        meta = document.createElement("meta");
        const parts = selector.split("[")[1].split("=");
        const attr = parts[0];
        const value = parts[1].replace(/['"]/g, "").replace(/]/g, "");

        meta.setAttribute(attr, value);
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
      }
    };

    // Update basic meta tags
    updateMetaTag('meta[name="description"]', seoDescription);
    updateMetaTag('meta[name="author"]', SITE.name);

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', seoTitle);
    updateMetaTag('meta[property="og:description"]', seoDescription);
    updateMetaTag('meta[property="og:type"]', seoOgType);
    updateMetaTag('meta[property="og:url"]', currentUrl);
    updateMetaTag('meta[property="og:site_name"]', SITE.name);
    updateMetaTag('meta[property="og:locale"]', SITE.ogLocale);

    // Resolve to an absolute URL since social crawlers may not correctly
    // resolve a relative og:image/twitter:image path.
    const absoluteOgImage = seoOgImage
      ? new URL(seoOgImage, window.location.origin).toString()
      : undefined;

    if (absoluteOgImage) {
      updateMetaTag('meta[property="og:image"]', absoluteOgImage);
      // 尺寸讓爬蟲不必先抓圖就知道是大圖，預覽也不會先閃一下小圖再換掉。
      updateMetaTag('meta[property="og:image:width"]', String(OG_IMAGE_WIDTH));
      updateMetaTag(
        'meta[property="og:image:height"]',
        String(OG_IMAGE_HEIGHT),
      );
      updateMetaTag('meta[property="og:image:alt"]', seoOgImageAlt);
    }

    // Update Twitter Card tags
    // 分享圖是 1200×630 的大圖版型，用 summary 會被裁成小方塊。
    updateMetaTag('meta[name="twitter:card"]', "summary_large_image");
    updateMetaTag('meta[name="twitter:title"]', seoTitle);
    updateMetaTag('meta[name="twitter:description"]', seoDescription);

    if (absoluteOgImage) {
      updateMetaTag('meta[name="twitter:image"]', absoluteOgImage);
    }

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');

    if (canonical) {
      canonical.setAttribute("href", currentUrl);
    } else {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", currentUrl);
      document.head.appendChild(canonical);
    }

    // Handle robots meta tag for noIndex
    if (noIndex) {
      updateMetaTag('meta[name="robots"]', "noindex, nofollow");
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');

      if (robotsMeta) {
        robotsMeta.remove();
      }
    }

    // 結構化資料。靜態 HTML 已經帶了一份，但 SPA 換頁後那份講的是上一頁，
    // 所以這裡連內容一起換掉；沒有資料的路由（noIndex）就把節點移除。
    const jsonLd = noIndex ? null : buildJsonLd(location.pathname);
    let jsonLdScript = document.getElementById(JSON_LD_ID);

    if (!jsonLd) {
      jsonLdScript?.remove();
    } else {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement("script");
        jsonLdScript.id = JSON_LD_ID;
        jsonLdScript.setAttribute("type", "application/ld+json");
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(jsonLd);
    }
  }, [
    location.pathname,
    seoTitle,
    seoDescription,
    seoOgType,
    seoOgImage,
    seoOgImageAlt,
    noIndex,
  ]);

  return null;
}

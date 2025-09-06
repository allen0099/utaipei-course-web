import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { getPageMeta } from "@/config/meta";
import { siteConfig } from "@/config/site";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export default function SEO({
  title,
  description,
  keywords,
  ogType,
  ogImage,
  noIndex = false,
}: SEOProps) {
  const location = useLocation();
  const pageMeta = getPageMeta(location.pathname);

  const seoTitle = title || pageMeta.title;
  const seoDescription = description || pageMeta.description;
  const seoKeywords = keywords || pageMeta.keywords;
  const seoOgType = ogType || pageMeta.ogType || "website";
  const seoOgImage = ogImage || pageMeta.ogImage;

  useEffect(() => {
    // Update document title
    document.title = seoTitle;

    // Build the full URL for og:url
    const currentUrl = `${window.location.origin}${location.pathname}`;

    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, content: string) => {
      let meta = document.querySelector(selector);

      if (meta) {
        meta.setAttribute("content", content);
      } else {
        meta = document.createElement("meta");
        const parts = selector.split("[")[1].split("=");
        const attr = parts[0];
        const value = parts[1].replace(/['"]/g, "").replace(/\]/g, "");

        meta.setAttribute(attr, value);
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
      }
    };

    // Update basic meta tags
    updateMetaTag('meta[name="description"]', seoDescription);
    if (seoKeywords) {
      updateMetaTag('meta[name="keywords"]', seoKeywords);
    }
    updateMetaTag('meta[name="author"]', "UTC 選課小幫手");
    updateMetaTag('meta[name="language"]', "zh-TW");

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', seoTitle);
    updateMetaTag('meta[property="og:description"]', seoDescription);
    updateMetaTag('meta[property="og:type"]', seoOgType);
    updateMetaTag('meta[property="og:url"]', currentUrl);
    updateMetaTag('meta[property="og:site_name"]', siteConfig.name);

    if (seoOgImage) {
      updateMetaTag('meta[property="og:image"]', seoOgImage);
    }

    // Update Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', "summary");
    updateMetaTag('meta[name="twitter:title"]', seoTitle);
    updateMetaTag('meta[name="twitter:description"]', seoDescription);

    if (seoOgImage) {
      updateMetaTag('meta[name="twitter:image"]', seoOgImage);
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
  }, [
    location.pathname,
    seoTitle,
    seoDescription,
    seoKeywords,
    seoOgType,
    seoOgImage,
    noIndex,
    location,
  ]);

  return null;
}

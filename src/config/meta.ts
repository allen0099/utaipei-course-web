import {
  defaultMeta as sharedDefaultMeta,
  getPageMeta as sharedGetPageMeta,
  pageMeta as sharedPageMeta,
} from "./page-meta.js";

export interface PageMeta {
  /** 頁面名稱，不含品牌後綴；導覽標籤與 <h1> 用的也是它。 */
  name: string;
  title: string;
  description: string;
  ogType?: string;
  ogImage?: string;
  ogImageAlt?: string;
  /** 送 robots noindex 並排除於 sitemap／JSON-LD 之外。 */
  noIndex?: boolean;
}

/**
 * 路由 metadata 的實際內容放在 config/page-meta.js——那是一份 scripts/
 * generate-static-pages.js 也能直接 import 的純 .js，避免靜態 HTML 與 runtime
 * 各留一份會漂移的複本。這裡只負責補上型別給 TS 端使用。
 */
export const pageMeta: Record<string, PageMeta> = sharedPageMeta;

export const defaultMeta: PageMeta = sharedDefaultMeta;

export const getPageMeta = (pathname: string): PageMeta =>
  sharedGetPageMeta(pathname);

export {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE,
  canonicalUrl,
  buildJsonLd,
} from "./page-meta.js";

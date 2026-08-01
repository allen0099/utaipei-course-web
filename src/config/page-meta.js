/**
 * 每條路由的 SEO metadata，以及由它衍生的正規網址與 JSON-LD。
 *
 * 這裡刻意寫成純 .js（package.json 是 `"type": "module"`）：
 * scripts/generate-static-pages.js 是 build 完才用 node 直接跑的腳本，沒有 TS
 * transpile 可用，以前只能自己再抄一份一模一樣的路由表——然後就漂移了。改成共用
 * 模組後，node 腳本與 src/config/meta.ts（負責補上型別）讀的是同一份資料。
 *
 * 慣例：頁面上的 <h1>（<PageHeader> 的 title）、導覽列標籤（config/site.ts）與
 * 這裡的 `name` 必須是同一個名字。唯一的例外是首頁——`name` 是導覽用的「首頁」、
 * <h1> 是品牌短名「選課小幫手」，而 title 用品牌全名。
 */

export const SITE = {
  /** 品牌全名，用於 og:site_name、author 與 title 後綴。 */
  name: "北市大選課小幫手",
  /** UI 上顯示的短名（navbar、首頁 h1）。 */
  shortName: "選課小幫手",
  baseUrl: "https://utc.allen0099.tw",
  /**
   * 沒有指定 ogImage 的路由用這張。所有 /og/*.png 都是 1200×630（scripts/
   * generate-brand-assets.js 產生），改尺寸的話 OG_IMAGE_WIDTH／HEIGHT 與
   * twitter:card 要一起改。
   */
  ogImage: "/og/home.png",
  ogImageAlt: "北市大選課小幫手",
  locale: "zh-TW",
  ogLocale: "zh_TW",
};

/**
 * 正規網址。GitHub Pages 對 /search 會 301 導到 /search/，所以 canonical、
 * og:url 與 sitemap 一律用尾斜線版本——也就是伺服器不必轉址就能直接給的網址。
 * SPA 內部導覽拿到的 location.pathname 沒有尾斜線，因此靜態與 runtime 兩邊都要
 * 經過這個函式才會一致。
 *
 * @param {string} pathname
 * @returns {string}
 */
export function canonicalUrl(pathname) {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return `${SITE.baseUrl}${path.endsWith("/") ? path : `${path}/`}`;
}

/**
 * 分享圖尺寸。Facebook／Twitter 都會拿它決定要不要用大圖版型，寫在 meta 裡
 * 爬蟲就不必先下載圖片才知道，圖也不會先閃一下小圖再換大圖。
 */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/**
 * @param {{
 *   name: string,
 *   title?: string,
 *   description: string,
 *   ogImage?: string,
 *   ogImageAlt?: string,
 *   noIndex?: boolean,
 * }} meta
 */
function page(meta) {
  return {
    /** 導覽標籤／麵包屑用的頁面名稱，不含品牌後綴。 */
    name: meta.name,
    title: meta.title ?? `${meta.name} - ${SITE.name}`,
    description: meta.description,
    ogType: "website",
    // 每頁一張 1200×630 的分享圖；沒指定就退回站台預設的那張。
    ogImage: meta.ogImage ?? SITE.ogImage,
    ogImageAlt: meta.ogImageAlt ?? `${meta.name}｜${SITE.name}`,
    noIndex: meta.noIndex ?? false,
  };
}

/**
 * description 的寫法：title 已經出現過的頁面名稱不再重複一次，校名整條最多出現
 * 一次（且只留在最需要被「臺北市立大學……」這類查詢字命中的首頁／行事曆／課程
 * 查詢），省下來的字數拿去寫實際功能。
 */
export const pageMeta = {
  "/": page({
    name: "首頁",
    title: SITE.name,
    description:
      "臺北市立大學課程查詢與課表工具，可查開課資料、排課表、偵測衝堂，並提供行事曆、校園地圖與節次表。",
    ogImage: "/og/home.png",
    // 首頁的 name 是導覽用的「首頁」，當替代文字太模糊，改用品牌全名。
    ogImageAlt: SITE.name,
  }),
  "/calendar": page({
    name: "校園行事曆",
    description:
      "查看臺北市立大學各學年度學期重要日程，可下載 .ics 或複製訂閱網址，讓學校更新自動同步到個人日曆。",
    ogImage: "/og/calendar.png",
  }),
  "/search": page({
    name: "課程查詢",
    description:
      "依學年期、學院系所或關鍵字搜尋臺北市立大學開課資料，勾選後即時組成週課表。",
    ogImage: "/og/search.png",
  }),
  "/my-schedule": page({
    name: "我的課表",
    description:
      "集中管理在課程查詢或班級／教師課表勾選的課程，自動標示衝堂時段，可分享連結或匯出成 .ics 日曆與課表圖片。",
    ogImage: "/og/my-schedule.png",
  }),
  "/share": page({
    name: "分享的課表",
    description:
      "開啟別人分享的課表連結，唯讀檢視上課時間與衝堂狀況，也能一鍵合併到自己的課表。",
    // noIndex 不代表不需要分享圖——這頁正是最常被貼進聊天室的那一頁，預覽圖
    // 是給人看的，跟要不要被搜尋引擎收錄是兩回事。
    ogImage: "/og/share.png",
    // 每條分享連結的內容都不同且只存在於網址片段裡，收錄進搜尋結果沒有意義，
    // 也不該讓某個人的課表被搜到。noIndex 的路由同時會被排除在 sitemap 與
    // JSON-LD 之外。
    noIndex: true,
  }),
  "/schedules/teacher": page({
    name: "教師課表",
    description:
      "依學年期與系級選擇教師，查看該教師整學期的授課科目、上課時間與週課表。",
    ogImage: "/og/schedules-teacher.png",
  }),
  "/schedules/class": page({
    name: "班級課表",
    description:
      "依學年期、學院、系所選擇班級，查看該班整學期的排課清單與週課表，含學分、必選修、教師、時間與教室。",
    ogImage: "/og/schedules-class.png",
  }),
  "/schedules/location": page({
    // 資料裡不只教室，還有攀岩場地、田徑場、網球場等場地，所以是「地點」不是「教室」。
    name: "地點課表",
    description:
      "查詢教室、球場、田徑場等場地整學期的使用狀況，確認哪些時段已被排課。",
    ogImage: "/og/schedules-location.png",
  }),
  "/map": page({
    name: "校園地圖",
    description:
      "博愛與天母校區大樓代碼對照表，搭配互動樓層平面圖，快速找到上課教室的位置。",
    ogImage: "/og/map.png",
  }),
  "/timetable": page({
    name: "校園節次表",
    description:
      "博愛與天母校區各節次的上下課時間對照，確認第幾節課從幾點開始。",
    ogImage: "/og/timetable.png",
  }),
};

export const defaultMeta = pageMeta["/"];

/**
 * @param {string} pathname
 */
export function getPageMeta(pathname) {
  // If pathname ends with a "/", remove it for matching
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return pageMeta[path] || defaultMeta;
}

const WEBSITE_ID = `${SITE.baseUrl}/#website`;

/**
 * 該路由要輸出的 JSON-LD。首頁描述整個網站與這個應用本身，其餘頁面給
 * WebPage ＋ 麵包屑；noIndex 的路由回傳 null（不請爬蟲索引，就不必給它資料）。
 *
 * @param {string} pathname
 * @returns {object | null}
 */
export function buildJsonLd(pathname) {
  const meta = getPageMeta(pathname);

  if (meta.noIndex) return null;

  const homeUrl = canonicalUrl("/");
  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.name,
    alternateName: SITE.shortName,
    url: homeUrl,
    description: defaultMeta.description,
    inLanguage: SITE.locale,
  };

  if (meta === defaultMeta) {
    return {
      "@context": "https://schema.org",
      "@graph": [
        website,
        {
          "@type": "WebApplication",
          "@id": `${SITE.baseUrl}/#webapp`,
          name: SITE.name,
          url: homeUrl,
          description: defaultMeta.description,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          inLanguage: SITE.locale,
          isPartOf: { "@id": WEBSITE_ID },
          // 免費工具。沒有 offers 的 WebApplication 在部分驗證器會被視為缺欄位。
          offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" },
        },
      ],
    };
  }

  const pageUrl = canonicalUrl(pathname);

  return {
    "@context": "https://schema.org",
    "@graph": [
      website,
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: meta.title,
        description: meta.description,
        url: pageUrl,
        inLanguage: SITE.locale,
        isPartOf: { "@id": WEBSITE_ID },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE.shortName,
            item: homeUrl,
          },
          { "@type": "ListItem", position: 2, name: meta.name, item: pageUrl },
        ],
      },
    ],
  };
}

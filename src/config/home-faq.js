/**
 * 首頁「常見問題」。
 *
 * 跟 page-meta.js 一樣寫成純 .js：首頁在 runtime 渲染它，scripts/
 * generate-static-pages.js 也把中文版直接寫進 dist/index.html 的 #root。兩邊
 * 讀同一份資料，爬蟲在執行 JS 前後看到的是同一段文字——只在靜態 HTML 出現、
 * 渲染後就消失的內容，對 Google 來說等於沒有（它索引的是渲染後的 DOM）。
 *
 * 這一段也是首頁少數「本站自己寫的」文字；其餘大多是學校的公告與行事曆。
 * 答案只寫純文字，靜態腳本不必處理連結或標記。
 *
 * @type {Array<{ q: string, a: string, qEn: string, aEn: string }>}
 */
export const HOME_FAQ = [
  {
    q: "這是學校官方的網站嗎？",
    a: "不是。北市大選課小幫手是非官方的課程查詢工具，與臺北市立大學沒有隸屬或授權關係。資料來自學校公開的選課系統，僅供參考，一切請以學校官方公告為準。",
    qEn: "Is this an official university website?",
    aEn: "No. UTaipei Course Helper is an unofficial course lookup tool with no affiliation to or authorization from the University of Taipei. Its data comes from the university's public course system and is for reference only; always defer to the university's official announcements.",
  },
  {
    q: "課程資料從哪裡來？多久更新一次？",
    a: "開課資料由開放原始碼的爬蟲每週自動從學校公開的課程系統抓取，行事曆、公告、教室與教師清單也各自定期更新。課程查詢頁會標示這學期資料的最後更新時間。",
    qEn: "Where does the course data come from, and how often is it updated?",
    aEn: "An open-source crawler collects course offerings from the university's public course system every week; the academic calendar, announcements, rooms and instructor lists are refreshed on their own schedules. Course Search shows when this semester's data was last updated.",
  },
  {
    q: "需要登入學校帳號嗎？我的課表存在哪裡？",
    a: "不需要登入，本站也不會詢問任何帳號密碼。勾選的課程只存在你自己瀏覽器的本機儲存空間，不會上傳到任何伺服器；要換裝置或給同學看，可以用分享連結把整份課表帶過去。",
    qEn: "Do I need to sign in? Where is my schedule stored?",
    aEn: "No sign-in is needed, and this site never asks for any account or password. The courses you pick are stored only in your own browser and are never uploaded to a server; to move them to another device or show a classmate, use a share link that carries the whole schedule.",
  },
  {
    q: "可以直接在這裡加退選嗎？",
    a: "不行。這裡用來查課、排課表和檢查衝堂，正式的加退選仍然要到學校的選課系統完成。",
    qEn: "Can I register for courses here?",
    aEn: "No. This site is for looking up courses, planning a timetable and checking for time conflicts; actual course registration still happens in the university's own system.",
  },
  {
    q: "課表可以放進手機行事曆嗎？",
    a: "可以。「我的課表」能匯出 .ics 日曆檔，從開學日排到期末考週並略過放假日，也能存成圖片；「校園行事曆」可以下載 .ics 或複製訂閱網址，學校更新後會自動同步到你的日曆。",
    qEn: "Can I put my timetable into my phone's calendar?",
    aEn: "Yes. My Schedule exports an .ics calendar file running from the first day of term to finals week with holidays skipped, or saves the timetable as an image. The Academic Calendar can be downloaded as .ics or subscribed to by URL, so updates from the university sync automatically.",
  },
];

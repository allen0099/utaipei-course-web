# UTC 選課小幫手（前端）

臺北市立大學選課輔助工具，提供課程查詢、我的課表、教師／系所／地點課表、校園行事曆與校園地圖等功能，讓選課更便利。

本專案為前端網站，**本身沒有後端**：所有課程資料在執行時直接讀取由 [utaipei-course-crawler](https://github.com/allen0099/utaipei-course-crawler) 爬取並發布到 GitHub Pages 的 JSON（`https://allen0099.github.io/utaipei-course-crawler`）。

## 功能

- **課程查詢**：依條件搜尋課程，並可將結果加入課表檢視。
- **我的課表**：選課清單以週課表呈現，並自動偵測時段衝堂。
- **週課表元件**：桌面為完整週表格；手機改為「單日 + 清單」版面，並可匯出 `.ics` 行事曆檔或課表圖片。
- **教師 / 系所 / 地點課表**：依教師、系所或上課地點檢視課表。
- **校園行事曆**：以民國曆（`zh-TW-u-ca-roc`）呈現學期行事曆。
- **校園地圖與節次表**：各棟樓層平面圖與各校區上課節次時間對照。

## 技術棧

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [HeroUI v3](https://heroui.com)
- [Tailwind CSS v4](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [Framer Motion](https://www.framer.com/motion)

## 開發

本專案**必須使用 [pnpm](https://pnpm.io/)**（版本已於 `package.json` 的 `packageManager` 鎖定）。`.npmrc` 內含 `public-hoist-pattern[]=*@heroui/*`，HeroUI 需要此設定才能正確解析。

```bash
pnpm install
```

### 常用指令

```bash
pnpm dev              # 啟動開發伺服器 http://localhost:5173
pnpm run build        # tsc 型別檢查 + vite build + 產生靜態頁 meta 標籤
pnpm run preview      # 預覽正式建置 http://localhost:4173
pnpm run lint         # eslint --fix
pnpm run generate-static  # 僅重新產生靜態頁 meta 標籤
```

`pnpm run build` 會在 `vite build` 之後執行 `scripts/generate-static-pages.js`，為每個路由產生含 Open Graph／meta 標籤的靜態 `index.html`，供社群平台與爬蟲在不執行 JavaScript 的情況下也能取得正確預覽資訊。

## 部署

透過 `.github/workflows/vite-build.yml`，於推送到 `master` 時自動建置並部署到 GitHub Pages。

## 相關連結

- 資料來源（爬蟲）：<https://github.com/allen0099/utaipei-course-crawler>
- 校園官網：<https://www.utaipei.edu.tw/>
- 校務資訊系統：<https://my.utaipei.edu.tw/utaipei/index_sky.html>

## License

以 [MIT License](./LICENSE) 授權。

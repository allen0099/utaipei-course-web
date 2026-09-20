import { Navbar } from "@/components/navbar";
import { Footbar } from "@/components/footbar.tsx";
import DisclaimerModal from "@/components/disclaimer.tsx";
import SEO from "@/components/seo-native.tsx";
import CommandPalette from "@/components/command-palette.tsx";

export default function DefaultLayout({
  children,
  noIndex = false,
  wide = false,
}: {
  children: React.ReactNode;
  /** Keep the route out of search results (e.g. a user's shared schedule). */
  noIndex?: boolean;
  /** 課程查詢右側多一欄迷你課表，需要比一般頁面寬的版心。 */
  wide?: boolean;
}) {
  return (
    <div className="relative flex flex-col min-h-screen">
      {/* 鍵盤使用者每換一頁都得先 Tab 過整條導覽列才到得了內容。平常看不到，
          第一次按 Tab 才浮出來。 */}
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg"
        href="#main-content"
      >
        跳到主要內容
      </a>
      <SEO noIndex={noIndex} />
      <CommandPalette />
      <DisclaimerModal />
      <Navbar />
      {/* Navbar 是 sticky（本身佔版面），不需要再留一段 padding 去避開它。 */}
      <main
        className={`container mx-auto px-6 flex-grow ${wide ? "max-w-[96rem]" : "max-w-7xl"}`}
        id="main-content"
        // 讓 skip link 跳過來之後，下一個 Tab 從內容開始而不是回到頁首。
        tabIndex={-1}
      >
        {children}
      </main>
      <Footbar />
    </div>
  );
}

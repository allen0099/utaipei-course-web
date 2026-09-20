import { Navbar } from "@/components/navbar";
import { Footbar } from "@/components/footbar.tsx";
import DisclaimerModal from "@/components/disclaimer.tsx";
import SEO from "@/components/seo-native.tsx";

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
      <SEO noIndex={noIndex} />
      <DisclaimerModal />
      <Navbar />
      {/* Navbar 是 sticky（本身佔版面），不需要再留一段 padding 去避開它。 */}
      <main
        className={`container mx-auto px-6 flex-grow ${wide ? "max-w-[96rem]" : "max-w-7xl"}`}
      >
        {children}
      </main>
      <Footbar />
    </div>
  );
}

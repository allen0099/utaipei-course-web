import { Navbar } from "@/components/navbar";
import { Footbar } from "@/components/footbar.tsx";
import DisclaimerModal from "@/components/disclaimer.tsx";
import SEO from "@/components/seo-native.tsx";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <SEO />
      <DisclaimerModal />
      <Navbar />
      {/* Navbar 是 sticky（本身佔版面），不需要再留一段 padding 去避開它。 */}
      <main className="container mx-auto max-w-7xl px-6 flex-grow">
        {children}
      </main>
      <Footbar />
    </div>
  );
}

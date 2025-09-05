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
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-16">
        {children}
      </main>
      <Footbar />
    </div>
  );
}

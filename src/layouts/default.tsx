import { Navbar } from "@/components/navbar";
import { Footbar } from "@/components/footbar.tsx";
import DisclaimerModal from "@/components/disclaimer.tsx";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <DisclaimerModal />
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-16">
        {children}
      </main>
      <Footbar />
    </div>
  );
}

import DefaultLayout from "@/layouts/default.tsx";
import { title } from "@/components/primitives.ts";
import { siteConfig } from "@/config/site.ts";
import { PDFDocument } from "@/components/pdf.tsx";
import SEO from "@/components/seo-native.tsx";

export const TimetablePage = () => {
  return (
    <DefaultLayout>
      <SEO />
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="flex max-sm:flex-col max-lg:w-full items-center">
          <h1 className={title()}>校園節次表</h1>
        </div>
        <PDFDocument link={`${siteConfig.links.github.api}/timetable.pdf`} />
      </section>
    </DefaultLayout>
  );
};

export default TimetablePage;

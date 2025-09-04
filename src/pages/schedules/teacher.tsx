import { title } from "@/components/primitives.ts";
import DefaultLayout from "@/layouts/default.tsx";
import SEO from "@/components/seo-native.tsx";

export const TeacherSchedulePage = () => {
  return (
    <DefaultLayout>
      <SEO />
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>教師課表查詢</h1>
          <p>此頁面正在建置中。</p>
        </div>
      </section>
    </DefaultLayout>
  );
};

export default TeacherSchedulePage;

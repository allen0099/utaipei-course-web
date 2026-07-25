import { PageHeader } from "@/components/page-header.tsx";
import DefaultLayout from "@/layouts/default.tsx";

export const ClassSearchPage = () => {
  return (
    <DefaultLayout>
      <section className="flex w-full flex-col gap-6 py-6 md:py-8">
        <PageHeader description="此頁面正在建置中。" title="班級課表" />
      </section>
    </DefaultLayout>
  );
};

export default ClassSearchPage;

import { Link } from "@heroui/link";

import DefaultLayout from "@/layouts/default";
import SEO from "@/components/seo-native.tsx";

export default function NotFoundPage() {
  return (
    <DefaultLayout>
      <SEO
        description="抱歉，您所尋找的頁面不存在。返回 UTC 選課小幫手首頁繼續使用服務。"
        noIndex={true}
        title="404 - 頁面找不到 | UTC 選課小幫手"
      />
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-xl mt-2">Page Not Found</p>
          <p className="text-default-500 mt-2">歐歐，你似乎發現了蟲洞。</p>
          <Link className="mt-6" href="/">
            返回首頁
          </Link>
        </div>
      </section>
    </DefaultLayout>
  );
}

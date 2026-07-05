import { Link } from "@heroui/react";

import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives.ts";

export default function NotFoundPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="text-center">
          <h1 className={title()}>404</h1>
          <p className="text-xl mt-2">Page Not Found</p>
          <p className="text-muted mt-2">歐歐，你似乎發現了蟲洞。</p>
          <Link className="mt-6" href="/">
            返回首頁
          </Link>
        </div>
      </section>
    </DefaultLayout>
  );
}

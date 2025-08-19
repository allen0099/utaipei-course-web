import { Link } from "@heroui/link";

import DefaultLayout from "@/layouts/default";

export default function NotFoundPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-xl mt-2">Page Not Found</p>
          <p className="text-default-500 mt-2">The page you are looking for does not exist.</p>
          <Link href="/" className="mt-6">
            Go back to Home
          </Link>
        </div>
      </section>
    </DefaultLayout>
  );
}

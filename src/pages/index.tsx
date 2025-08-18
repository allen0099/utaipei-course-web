import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { useEffect, useState } from "react";
import { Link } from "@heroui/link";

import DefaultLayout from "@/layouts/default";
import { AnnouncementItem } from "@/interfaces/announcements.ts";

export default function IndexPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      "https://allen0099.github.io/utaipei-course-crawler/announcement.json",
    )
      .then((res) => res.json())
      .then((data) => {
        setAnnouncements(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 計算縮排 class
  const getIndentClass = (level: number) => {
    // level=1 無縮排，level=2 pl-4, level=3 pl-8 ...
    return `pl-${(level - 1) * 4}`;
  };

  // 將 text 中出現 href.text 的部分轉為 Link，並在 Link 前後自動補空白（若無則補）
  function renderTextWithLinks(
    text: string,
    hrefs?: { link: string; text: string }[],
  ) {
    if (!hrefs || hrefs.length === 0) return text;
    // 依照 hrefs.text 長度排序，避免短字串先被分割
    const sortedHrefs = [...hrefs].sort(
      (a, b) => b.text.length - a.text.length,
    );
    let parts: (string | { link: string; text: string })[] = [text];

    sortedHrefs.forEach((href) => {
      const nextParts: (string | { link: string; text: string })[] = [];

      parts.forEach((part) => {
        if (typeof part === "string") {
          const split = part.split(href.text);

          for (let i = 0; i < split.length; i++) {
            if (split[i]) nextParts.push(split[i]);
            if (i < split.length - 1) nextParts.push(href);
          }
        } else {
          nextParts.push(part);
        }
      });
      parts = nextParts;
    });
    // 處理 Link 前後自動補空白
    const isPunctuation = (ch: string) =>
      /[\s.,;:!?\-\)\]"'、。！？：；，）】》]/.test(ch);

    return parts.map((part, idx) => {
      if (typeof part === "string") {
        return <span key={idx}>{part}</span>;
      } else {
        // 取得前後的字串
        const prev =
          idx > 0 && typeof parts[idx - 1] === "string"
            ? (parts[idx - 1] as string)
            : "";
        const next =
          idx < parts.length - 1 && typeof parts[idx + 1] === "string"
            ? (parts[idx + 1] as string)
            : "";
        // 判斷是否需要在 Link 前後補空白
        const needSpaceBefore = prev && !prev.match(/[\s]$/);
        const needSpaceAfter =
          next && !next.match(/^[\s]/) && !(next && isPunctuation(next[0]));

        return (
          <>
            {needSpaceBefore && " "}
            <Link
              key={idx}
              isExternal
              className="text-blue-600 underline hover:text-blue-800"
              href={part.link}
            >
              {part.text}
            </Link>
            {needSpaceAfter && " "}
          </>
        );
      }
    });
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        {loading ? (
          <Spinner />
        ) : (
          <Card
            isFooterBlurred
            className="border-none w-full max-w-2xl bg-yellow-50"
            radius="lg"
          >
            <CardHeader className="flex justify-center text-center w-full">
              <p className="text-2xl font-bold w-full">校園公告</p>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2">
                {announcements.map((item, idx) => (
                  <li key={idx} className={getIndentClass(item.level)}>
                    <span className="text-default-700 whitespace-pre-line">
                      {renderTextWithLinks(item.text, item.href)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
            <CardFooter>
              <Link
                isExternal
                showAnchorIcon
                href="https://my.utaipei.edu.tw/utaipei/index_sky.html"
              >
                詳細公告請見校務資訊系統
              </Link>
            </CardFooter>
          </Card>
        )}
      </section>
    </DefaultLayout>
  );
}

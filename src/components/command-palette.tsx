import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Modal } from "@heroui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import { siteConfig } from "@/config/site.ts";
import { LocationEntry, TeacherUnit } from "@/interfaces/globals.ts";
import { useCourseCatalog, useCourseIndex } from "@/hooks/useCourseCatalog.ts";
import { useYms } from "@/hooks/useYms.ts";

/** Navbar 的搜尋按鈕用這個事件打開面板；兩者不在同一棵子樹裡。 */
export const OPEN_PALETTE_EVENT = "utc:open-palette";

const PER_GROUP_LIMIT = 6;

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  hint?: string;
  href: string;
}

/**
 * Ctrl/⌘+K 全域搜尋：一個輸入框同時找頁面、教師、地點與課程。
 *
 * 要找某位老師的課表，原本是「課表查詢 → 教師課表 → 選系級 → 選教師」四步，
 * 而且得先知道老師掛在哪個系級底下。這裡直接打名字就到。
 *
 * 三份資料只在面板第一次打開時才抓（傳空字串給 hook 就不會發請求），而且走
 * useFetchJson 的共用快取 —— 沒按過 Ctrl+K 的人一個 byte 都不會多付，按過的
 * 人之後進課程查詢也不必再抓一次 courses.json。只搜尋目前學年期：跨學年期的
 * 查詢是課程查詢頁的工作。
 */
export const CommandPalette = () => {
  const navigate = useNavigate();
  const { defaultCode } = useYms();
  const [isOpen, setIsOpen] = useState(false);
  // 打開過一次就留著：關掉再開不必重新等資料。
  const [hasOpened, setHasOpened] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const yms = hasOpened ? (defaultCode ?? "") : "";
  const { data: courses, loading: coursesLoading } = useCourseCatalog(yms);
  const { data: teacherIndex } = useCourseIndex<TeacherUnit>(
    yms,
    "teachers.json",
  );
  const { data: locationIndex } = useCourseIndex<LocationEntry>(
    yms,
    "locations.json",
  );

  useEffect(() => {
    const open = () => {
      setHasOpened(true);
      setIsOpen(true);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        // 瀏覽器的 Ctrl+K 是「跳到網址列搜尋」，不攔下來面板會和它一起出現。
        event.preventDefault();
        open();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, open);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, open);
    };
  }, []);

  const pages = useMemo<PaletteItem[]>(
    () =>
      siteConfig.navMenuItems.map((item) => ({
        id: `page-${item.href}`,
        group: "頁面",
        label: item.label,
        href: item.href,
      })),
    [],
  );

  // 同一位老師會掛在好幾個系級底下；面板上只要出現一次，連到第一個就好。
  const teachers = useMemo<PaletteItem[]>(() => {
    const seen = new Set<string>();
    const items: PaletteItem[] = [];

    (teacherIndex?.entries ?? []).forEach((unit) => {
      unit.teachers.forEach((teacher) => {
        if (seen.has(teacher.code)) return;
        seen.add(teacher.code);
        items.push({
          id: `teacher-${teacher.code}`,
          group: "教師",
          label: teacher.name,
          hint: unit.name,
          href: `/schedules/teacher?${new URLSearchParams({
            yms,
            unit: unit.code,
            teacher: teacher.code,
          }).toString()}`,
        });
      });
    });

    return items;
  }, [teacherIndex, yms]);

  const locations = useMemo<PaletteItem[]>(
    () =>
      (locationIndex?.entries ?? []).map((location) => ({
        id: `location-${location.code}`,
        group: "地點",
        label: location.name,
        href: `/schedules/location?${new URLSearchParams({
          yms,
          location: location.code,
        }).toString()}`,
      })),
    [locationIndex, yms],
  );

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) return pages;

    const match = (items: PaletteItem[]) =>
      items
        .filter((item) => item.label.toLowerCase().includes(keyword))
        .slice(0, PER_GROUP_LIMIT);

    const matchedCourses = (courses ?? [])
      .filter(
        (course) =>
          course.name.toLowerCase().includes(keyword) ||
          course.code.toLowerCase().includes(keyword) ||
          course.nameEn?.toLowerCase().includes(keyword),
      )
      .slice(0, PER_GROUP_LIMIT)
      .map<PaletteItem>((course) => ({
        id: `course-${course.code}`,
        group: "課程",
        label: course.name,
        hint: [course.code, course.teacher, course.class]
          .filter(Boolean)
          .join(" · "),
        href: `/search?${new URLSearchParams({ yms, q: course.code }).toString()}`,
      }));

    return [
      ...match(pages),
      ...match(teachers),
      ...match(locations),
      ...matchedCourses,
      // 永遠留一條退路：上面每組只列前幾筆，完整結果在課程查詢。
      {
        id: "search-all",
        group: "課程",
        label: `在課程查詢搜尋「${query.trim()}」`,
        href: `/search?${new URLSearchParams({ q: query.trim() }).toString()}`,
      },
    ];
  }, [query, pages, teachers, locations, courses, yms]);

  const close = () => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
  };

  const go = (item: PaletteItem | undefined) => {
    if (!item) return;
    close();
    navigate(item.href);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 注音／倉頡選字時的 Enter 與方向鍵是給輸入法的，不是給清單的。
    if (event.nativeEvent.isComposing) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[activeIndex]);
    }
  };

  const activeId = results[activeIndex]?.id;

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => (open ? setIsOpen(true) : close())}
      >
        <Modal.Container className="max-w-xl" placement="top">
          <Modal.Dialog aria-label="全站搜尋" className="p-0">
            <div className="flex items-center gap-2 border-b border-border px-4">
              <MagnifyingGlassIcon className="size-5 shrink-0 text-muted" />
              <input
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                aria-activedescendant={activeId}
                aria-controls="command-palette-results"
                aria-expanded="true"
                aria-label="搜尋頁面、教師、地點或課程"
                className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted"
                placeholder="搜尋頁面、教師、地點或課程…"
                role="combobox"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
              />
              <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-xs text-muted sm:block">
                Esc
              </kbd>
            </div>

            <ul
              className="max-h-[60vh] overflow-y-auto p-2"
              id="command-palette-results"
              role="listbox"
            >
              {results.map((item, index) => (
                <li
                  key={item.id}
                  aria-selected={index === activeIndex}
                  id={item.id}
                  role="option"
                >
                  {/* 換組時才印組名，清單本身保持扁平，方向鍵才能一路按到底。 */}
                  {item.group !== results[index - 1]?.group && (
                    <p className="px-2 pb-1 pt-2 text-xs font-medium text-muted">
                      {item.group}
                    </p>
                  )}
                  <button
                    className={clsx(
                      "flex w-full items-baseline gap-2 rounded-md px-2 py-2 text-left text-sm",
                      index === activeIndex && "bg-surface-secondary",
                    )}
                    tabIndex={-1}
                    type="button"
                    onClick={() => go(item)}
                    onMouseMove={() => setActiveIndex(index)}
                  >
                    <span className="min-w-0 truncate">{item.label}</span>
                    {item.hint && (
                      <span className="min-w-0 shrink truncate text-xs text-muted">
                        {item.hint}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {query.trim() && coursesLoading && (
              <p className="border-t border-border px-4 py-2 text-xs text-muted">
                載入課程資料中⋯
              </p>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default CommandPalette;

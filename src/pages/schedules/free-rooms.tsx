import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Button, Link, Separator, ToggleButton } from "@heroui/react";
import { Key } from "@react-types/shared";

import DefaultLayout from "@/layouts/default.tsx";
import { PageHeader } from "@/components/page-header.tsx";
import { PageSection } from "@/components/panel.tsx";
import { EmptyState, LoadingState, Notice } from "@/components/states.tsx";
import { FetchError } from "@/components/fetch-error.tsx";
import { YmsSelector } from "@/components/selectors/ymsSelector.tsx";
import { SchedulePreview, slotKey } from "@/components/schedule-preview.tsx";
import { DEFAULT_CAMPUS_MAPPINGS } from "@/components/weekly-schedule.tsx";
import { LocationEntry } from "@/interfaces/globals.ts";
import {
  buildCatalog,
  resolveCourses,
  useCourseCatalog,
  useCourseIndex,
} from "@/hooks/useCourseCatalog.ts";
import { convertCourses } from "@/utils/convert-course.ts";
import { useT } from "@/i18n/language.tsx";
import { campusName, dayName } from "@/i18n/terms.ts";

const PARAM_YMS = "yms";
const PARAM_CAMPUS = "campus";
const PARAM_TIME = "time";

const SLOT_PATTERN = /^[0-6]-([1-9]|1[0-4])$/;
const CAMPUS_OPTIONS = ["博愛", "天母"];

// 「教室未定」「校外場地」「各場地」不是一個可以走進去的地方，列成空教室只會
// 誤導人。
const NOT_A_ROOM = /未定|校外|各場地/;

/** 現在是第幾節。節次之間的下課時間算進下一節：那是人在找教室的時候。 */
const currentSlot = (campus: string): string | null => {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const mapping =
    DEFAULT_CAMPUS_MAPPINGS.find((item) => item.name.startsWith(campus)) ??
    DEFAULT_CAMPUS_MAPPINGS[0];

  const period = mapping.periods.find((item) => {
    const [hour, minute] = item.endTime.split(":").map(Number);

    return minutes <= hour * 60 + minute;
  });

  return period ? slotKey((now.getDay() + 6) % 7, period.period) : null;
};

/**
 * 尋找空教室：地點課表反過來查 —— 不是「這間教室什麼時候有課」，而是「這個
 * 時段哪些教室沒課」。資料就是 locations.json + courses.json，沒有多抓任何東西。
 */
export const FreeRoomsPage = () => {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();

  const [initialYms] = useState(() => searchParams.get(PARAM_YMS) ?? "");
  const [yms, setYms] = useState(initialYms);
  const [campus, setCampus] = useState(
    () => searchParams.get(PARAM_CAMPUS) ?? "",
  );
  const [slots, setSlots] = useState<Set<string>>(
    () =>
      new Set(
        (searchParams.get(PARAM_TIME) ?? "")
          .split(".")
          .filter((key) => SLOT_PATTERN.test(key)),
      ),
  );

  useEffect(() => {
    const params = new URLSearchParams();

    if (yms) params.set(PARAM_YMS, yms);
    if (campus) params.set(PARAM_CAMPUS, campus);
    if (slots.size > 0) params.set(PARAM_TIME, [...slots].sort().join("."));

    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yms, campus, slots]);

  const {
    data: index,
    loading: indexLoading,
    error: indexError,
    refetch: refetchIndex,
  } = useCourseIndex<LocationEntry>(yms, "locations.json");
  const {
    data: courses,
    loading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useCourseCatalog(yms);

  // 每個地點整學期被排課佔掉的格子。
  const rooms = useMemo(() => {
    const catalog = buildCatalog(courses, index?.extraCourses);

    return (index?.entries ?? [])
      .filter((entry) => !NOT_A_ROOM.test(entry.name))
      .map((entry) => {
        const occupied = new Set<string>();

        convertCourses(
          resolveCourses(catalog, entry.courseCodes).courses,
        ).forEach((slot) => {
          for (let i = 0; i < (slot.duration || 1); i++) {
            occupied.add(slotKey(slot.day, slot.period + i));
          }
        });

        return { ...entry, occupied };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
  }, [index, courses]);

  // 所選時段都在同一天時，可以多回答一句「之後還能待多久」。
  const singleDay = useMemo(() => {
    const days = new Set([...slots].map((key) => Number(key.split("-")[0])));

    if (days.size !== 1) return null;

    return {
      day: [...days][0],
      lastPeriod: Math.max(
        ...[...slots].map((key) => Number(key.split("-")[1])),
      ),
    };
  }, [slots]);

  const freeRooms = useMemo(() => {
    if (slots.size === 0) return [];

    return rooms
      .filter((room) => !campus || room.name.startsWith(campus))
      .filter((room) => [...slots].every((key) => !room.occupied.has(key)))
      .map((room) => {
        if (!singleDay) return { ...room, freeUntil: "" };

        let next = singleDay.lastPeriod + 1;

        while (next <= 14 && !room.occupied.has(slotKey(singleDay.day, next))) {
          next++;
        }

        return {
          ...room,
          freeUntil:
            next > 14
              ? t("當天之後都沒課", "Free for the rest of the day")
              : next === singleDay.lastPeriod + 1
                ? t(`第 ${next} 節有課`, `In use from period ${next}`)
                : t(`空到第 ${next - 1} 節`, `Free through period ${next - 1}`),
        };
      });
  }, [rooms, slots, campus, singleDay, t]);

  // 時段與校區跟學年期無關，換學年期不必清。
  const onYmsChange = (id: Key | null) => {
    setYms(id?.toString() || "");
  };

  const toggleSlot = (key: string) => {
    setSlots((current) => {
      const next = new Set(current);

      if (!next.delete(key)) next.add(key);

      return next;
    });
  };

  const pickNow = () => {
    const key = currentSlot(campus || "博愛");

    setSlots(key ? new Set([key]) : new Set());
  };

  const loading = indexLoading || coursesLoading;
  const error = indexError || coursesError;

  const slotSummary = [...slots]
    .sort()
    .map((key) => {
      const [day, period] = key.split("-").map(Number);

      return `${dayName(day, t)} ${period}`;
    })
    .join("、");

  return (
    <DefaultLayout>
      <PageSection>
        <PageHeader
          className="mb-6 max-w-5xl"
          description={t(
            "選一個時段，列出該時段沒有排課的教室與場地。",
            "Pick a time slot to list the rooms and venues with nothing scheduled.",
          )}
          title={t("尋找空教室", "Find Free Rooms")}
        />
        <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[20rem_minmax(0,1fr)] md:items-start">
          <div className="flex flex-col gap-4">
            <YmsSelector
              className="w-full"
              initialKey={initialYms || undefined}
              onChange={onYmsChange}
            />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">{t("校區", "Campus")}</span>
              {CAMPUS_OPTIONS.map((option) => (
                <ToggleButton
                  key={option}
                  isSelected={campus === option}
                  size="sm"
                  onChange={(selected) => setCampus(selected ? option : "")}
                >
                  {campusName(option, t)}
                </ToggleButton>
              ))}
              <Button size="sm" variant="secondary" onPress={pickNow}>
                {t("現在", "Now")}
              </Button>
            </div>
            <SchedulePreview
              idleHint={t(
                "點格子選時段，可以一次選好幾節。",
                "Click cells to pick time slots; several at once is fine.",
              )}
              scheduled={[]}
              selectedSlots={slots}
              onClearSlots={() => setSlots(new Set())}
              onToggleSlot={toggleSlot}
            />
          </div>

          <div className="min-w-0">
            {error ? (
              <FetchError
                message={t(
                  "這個學年期尚未收錄地點課表，請改選其他學年期。",
                  "Room schedules are not available for this semester yet. Try another one.",
                )}
                onRetry={() => {
                  refetchIndex();
                  refetchCourses();
                }}
              />
            ) : loading ? (
              <LoadingState label={t("教室資料", "room data")} />
            ) : slots.size === 0 ? (
              <EmptyState
                description={t(
                  "在左邊的格子點選想找的時段，或按「現在」直接看這一節。",
                  "Pick the slots you want on the grid, or press Now for the current period.",
                )}
                title={t("請先選擇時段", "Pick a time slot first")}
              />
            ) : (
              <>
                <h2 aria-live="polite" className="text-sm font-medium">
                  {t(
                    `${slotSummary} 節：${freeRooms.length} 個地點沒有排課`,
                    `${slotSummary}: ${freeRooms.length} location(s) with nothing scheduled`,
                  )}
                </h2>
                {/* 「沒排課」不等於「門開著」，這一點得講在結果上面而不是藏在
                    頁尾 —— 使用者是拿這份清單直接走過去的。 */}
                <Notice className="mt-3">
                  {t(
                    "這裡只知道課表上沒有排課，不代表教室有開放，也看不到社團或臨時借用。",
                    "This only knows that no course is scheduled. It does not mean the room is open, and club or ad-hoc bookings are not visible.",
                  )}
                </Notice>
                <Separator className="my-4" />
                {freeRooms.length === 0 ? (
                  <EmptyState
                    description={t(
                      "試試少選幾節，或取消校區條件。",
                      "Try fewer periods, or clear the campus filter.",
                    )}
                    title={t(
                      "這個時段沒有空的地點",
                      "No free locations in this slot",
                    )}
                  />
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {freeRooms.map((room) => (
                      <li key={room.code}>
                        <Link
                          className="flex w-full flex-col items-start rounded-lg border border-border px-3 py-2 no-underline hover:bg-background-secondary"
                          href={`/schedules/location?${new URLSearchParams({
                            yms,
                            location: room.code,
                          }).toString()}`}
                        >
                          <span className="text-sm font-medium text-foreground">
                            {room.name}
                          </span>
                          {room.freeUntil && (
                            <span className="text-xs text-muted">
                              {room.freeUntil}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </PageSection>
    </DefaultLayout>
  );
};

export default FreeRoomsPage;

import { useState } from "react";
import { Separator } from "@heroui/react";
import { Key } from "@react-types/shared";

import { DataTable, DataTableColumn } from "@/components/data-table.tsx";
import { EmptyState, LoadingState } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";
import { sectionTitle } from "@/components/primitives.ts";
import DefaultLayout from "@/layouts/default.tsx";
import { siteConfig } from "@/config/site.ts";
import { CourseItem, LocationItem } from "@/interfaces/globals.ts";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import { YmsSelector } from "@/components/selectors/ymsSelector.tsx";
import { ItemSelector } from "@/components/selectors/itemSelector.tsx";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { PageHeader } from "@/components/page-header.tsx";

const COLUMNS: DataTableColumn<CourseItem>[] = [
  {
    key: "code",
    label: "課程代碼",
    headerLabel: "代碼",
    width: "w-[16%]",
    cellClassName: "tabular-nums text-muted",
    hideOnCard: true,
  },
  {
    key: "name",
    label: "課程名稱",
    width: "w-[30%]",
    cellClassName: "font-medium text-foreground",
    hideOnCard: true,
  },
  { key: "teacher", label: "教師", width: "w-[16%]" },
  { key: "class", label: "班級名稱", headerLabel: "班級", width: "w-[20%]" },
  {
    key: "time",
    label: "時間",
    width: "w-[18%]",
    cellClassName: "tabular-nums text-foreground/80",
  },
];

const LocationTable = ({ courses }: { courses: CourseItem[] }) => {
  if (!courses || courses.length === 0) {
    return (
      <EmptyState
        description="這個地點在本學期沒有排課紀錄。"
        title="查無課程"
      />
    );
  }

  return (
    <DataTable
      cardSubtitle={(item) => item.code}
      cardTitle={(item) => item.name}
      className="mt-4"
      columns={COLUMNS}
      rowKey={(item, index) => `${item.code}-${item.class}-${index}`}
      rows={courses}
    />
  );
};

export const LocationSearchPage = () => {
  const [yms, setYms] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [year, semester] = yms.split("#");

  const {
    data: locations = [],
    loading,
    error,
    refetch,
  } = useFetchJson<LocationItem[]>(
    yms
      ? `${siteConfig.links.github.api}/${year}/${semester}/locations.json`
      : null,
  );

  const scheduleTitle = `${year} 學年 (${semester}) ${locations.find((loc) => loc.code === location)?.name || ""} 的課表`;
  const selectedLocation = locations.find((loc) => loc.code === location);

  const onYmsChange = (id: Key | null) => {
    setYms(id?.toString() || "");
    setLocation("");
  };

  const onLocationChange = (id: Key | null) => {
    setLocation(id?.toString() || "");
  };

  return (
    <DefaultLayout>
      <PageSection>
        <PageHeader
          className="mb-6"
          description="查詢某間教室或場地在該學期的使用課表。"
          title="地點課表"
        />
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl items-center">
          <YmsSelector onChange={onYmsChange} />
          <ItemSelector
            items={locations}
            label="選擇地點"
            onChange={onLocationChange}
          />
        </div>
        {loading && <LoadingState className="mt-4" label="地點資料" />}
        {error && (
          <FetchError
            className="mt-4"
            message="地點資料載入失敗。"
            onRetry={refetch}
          />
        )}
        <Separator className="my-6 max-w-5xl w-full" />
        <div className="w-full max-w-5xl">
          {selectedLocation ? (
            <>
              {/* scheduleTitle 已含學年期，不再另外重複一行「學期：」 */}
              <h2 className={sectionTitle({ size: "sm", align: "center" })}>
                {scheduleTitle}
              </h2>
              <LocationTable courses={selectedLocation.courses} />
              <WeeklySchedule
                courses={convertCourses(selectedLocation.courses)}
                scheduleTitle={scheduleTitle}
              />
            </>
          ) : (
            <EmptyState
              description="選擇學年期與地點後，會顯示該教室或場地整學期的使用課表。"
              title="尚未選擇地點"
            />
          )}
        </div>
      </PageSection>
    </DefaultLayout>
  );
};

export default LocationSearchPage;

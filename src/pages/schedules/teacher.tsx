import { Separator, Spinner } from "@heroui/react";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Key } from "@react-types/shared";

import DefaultLayout from "@/layouts/default.tsx";
import { YmsSelector } from "@/components/selectors/ymsSelector.tsx";
import { ItemSelector } from "@/components/selectors/itemSelector.tsx";
import { siteConfig } from "@/config/site.ts";
import { TeacherClasses, Units } from "@/interfaces/globals.ts";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { FetchError } from "@/components/fetch-error.tsx";

type SelectorProps = {
  setTeacher: Dispatch<SetStateAction<TeacherClasses | undefined>>;
};

const Selector = (prop: SelectorProps) => {
  const [yms, setYms] = useState<string>("");
  const [unit, setUnit] = useState<Units | undefined>(undefined);

  const [year, semester] = yms.split("#");

  const {
    data: rawUnits,
    loading,
    error,
    refetch,
  } = useFetchJson<Units[]>(
    yms
      ? `${siteConfig.links.github.api}/${year}/${semester}/teachers.json`
      : null,
  );

  // Data input is reversed to show latest first
  const units = useMemo(
    () => (rawUnits ? [...rawUnits].reverse() : []),
    [rawUnits],
  );

  const teachers = useMemo(() => unit?.teachers || [], [unit]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl items-center">
      <div className="flex flex-col md:flex-row gap-4 w-full items-center">
        <YmsSelector
          onChange={(id: Key | null) => {
            setYms(id?.toString() || "");
          }}
        />
        <ItemSelector
          items={units}
          label="請選擇系級"
          onChange={(id) => {
            setUnit(units.find((u) => u.code === id) || undefined);
          }}
        />
        <ItemSelector
          items={teachers}
          label="請選擇教師"
          onChange={(id) => {
            const teacher = teachers.find((t) => t.code === id);

            if (teacher) {
              prop.setTeacher(teacher);
            }
          }}
        />
      </div>
      {loading && (
        <div className="flex items-center gap-2">
          <Spinner />
          <span>載入系級資料中...</span>
        </div>
      )}
      {error && <FetchError message="系級資料載入失敗。" onRetry={refetch} />}
    </div>
  );
};

export const TeacherSchedulePage = () => {
  const [teacher, setTeacher] = useState<TeacherClasses>();

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center py-8 md:py-10 w-full">
        <Selector setTeacher={setTeacher} />
        <Separator className="my-6 max-w-5xl w-full" />
        {teacher ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {teacher.class.map((c) => (
                <div
                  key={c.code}
                  className="w-full max-w-2xl p-4 border rounded-lg shadow-sm mb-4"
                >
                  <h2 className="text-xl font-semibold mb-2">
                    {c.name} ({c.code})
                  </h2>
                  <p className="mb-1">
                    <strong>班級：</strong>
                    {c.class}
                  </p>
                  <p className="mb-1">
                    <strong>時間：</strong>
                    {c.time || "時間未定"}
                  </p>
                  <p className="mb-1">
                    <strong>教師：</strong>
                    {c.teacher}
                  </p>
                </div>
              ))}
            </div>
            <WeeklySchedule
              className="mt-5"
              courses={convertCourses(teacher.class)}
              scheduleTitle={`${teacher.name} 教師的課表`}
            />
          </>
        ) : (
          <p className="text-gray-500">請選擇系級與教師以查看課程。</p>
        )}
      </section>
    </DefaultLayout>
  );
};

export default TeacherSchedulePage;

import { Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import IndexPage from "@/pages/index";
import CalendarPage from "@/pages/calendar.tsx";
import SearchPage from "@/pages/search.tsx";
import TeacherSchedulePage from "@/pages/schedules/teacher.tsx";
import ClassSearchPage from "@/pages/schedules/class.tsx";
import NotFoundPage from "@/pages/not-found";
import MapPage from "@/pages/map.tsx";
import TimetablePage from "@/pages/timetable.tsx";
import LocationSearchPage from "@/pages/schedules/location.tsx";
import WeeklyScheduleDemo from "@/pages/weekly-schedule-demo.tsx";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectPath = sessionStorage.getItem("redirect");

    if (redirectPath) {
      sessionStorage.removeItem("redirect");
      const url = new URL(redirectPath);

      navigate(url.pathname, { replace: true });
    }
  }, [navigate]);

  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<CalendarPage />} path="/calendar" />
      <Route element={<MapPage />} path="/map" />
      <Route element={<SearchPage />} path="/search" />
      <Route element={<TeacherSchedulePage />} path="/schedules/teacher" />
      <Route element={<ClassSearchPage />} path="/schedules/class" />
      <Route element={<LocationSearchPage />} path="/schedules/location" />
      <Route element={<TimetablePage />} path="/timetable" />
      <Route element={<WeeklyScheduleDemo />} path="/weekly-schedule-demo" />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  );
}

export default App;

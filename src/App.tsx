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
import ErrorBoundary from "@/components/error-boundary.tsx";

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
    <ErrorBoundary>
      <Routes>
        <Route element={<IndexPage />} path="/" />
        <Route element={<CalendarPage />} path="/calendar" />
        <Route element={<MapPage />} path="/map" />
        <Route element={<SearchPage />} path="/search" />
        <Route element={<TeacherSchedulePage />} path="/schedules/teacher" />
        <Route element={<ClassSearchPage />} path="/schedules/class" />
        <Route element={<LocationSearchPage />} path="/schedules/location" />
        <Route element={<TimetablePage />} path="/timetable" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

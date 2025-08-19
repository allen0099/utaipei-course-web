import { Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import IndexPage from "@/pages/index";
import CourseCalendarPage from "@/pages/course-calendar";
import AdvancedSearchPage from "@/pages/advanced-search";
import TeacherSchedulePage from "@/pages/teacher-schedule";
import ClassSchedulePage from "@/pages/class-schedule";
import NotFoundPage from "@/pages/not-found";

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
      <Route element={<CourseCalendarPage />} path="/calendar" />
      <Route element={<AdvancedSearchPage />} path="/search" />
      <Route element={<TeacherSchedulePage />} path="/teacher-schedule" />
      <Route element={<ClassSchedulePage />} path="/class-schedule" />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  );
}

export default App;

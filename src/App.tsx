import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import CourseCalendarPage from "@/pages/course-calendar";
import AdvancedSearchPage from "@/pages/advanced-search";
import TeacherSchedulePage from "@/pages/teacher-schedule";
import ClassSchedulePage from "@/pages/class-schedule";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<CourseCalendarPage />} path="/calendar" />
      <Route element={<AdvancedSearchPage />} path="/search" />
      <Route element={<TeacherSchedulePage />} path="/teacher-schedule" />
      <Route element={<ClassSchedulePage />} path="/class-schedule" />
    </Routes>
  );
}

export default App;

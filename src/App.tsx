import { Route, Routes, useLocation, useNavigate } from "react-router";
import { lazy, Suspense, useEffect } from "react";

import IndexPage from "@/pages/index";
import SearchPage from "@/pages/search.tsx";
import MySchedulePage from "@/pages/my-schedule.tsx";
import NotFoundPage from "@/pages/not-found";
import ErrorBoundary from "@/components/error-boundary.tsx";
import { LoadingState } from "@/components/states.tsx";
import { useT } from "@/i18n/language.tsx";

// 首頁、課程查詢、我的課表是絕大多數造訪的落點，留在主 bundle 裡，第一個畫面
// 不必多等一個 chunk。其餘各頁用到才載 —— 校園地圖的樓層 SVG 與行事曆月曆不該
// 由只是來查課的人買單。service worker 會把這些 chunk 預先快取，所以離線時
// 一樣開得起來。
const CalendarPage = lazy(() => import("@/pages/calendar.tsx"));
const MapPage = lazy(() => import("@/pages/map.tsx"));
const TimetablePage = lazy(() => import("@/pages/timetable.tsx"));
const SharedSchedulePage = lazy(() => import("@/pages/share.tsx"));
const TeacherSchedulePage = lazy(() => import("@/pages/schedules/teacher.tsx"));
const ClassSearchPage = lazy(() => import("@/pages/schedules/class.tsx"));
const LocationSearchPage = lazy(() => import("@/pages/schedules/location.tsx"));
const FreeRoomsPage = lazy(() => import("@/pages/schedules/free-rooms.tsx"));

function App() {
  const t = useT();
  const navigate = useNavigate();

  useEffect(() => {
    const redirectPath = sessionStorage.getItem("redirect");

    if (redirectPath) {
      sessionStorage.removeItem("redirect");
      const url = new URL(redirectPath);

      // Search and hash have to be carried over, not just the path: shared
      // schedules put their whole payload in the fragment, and /search keeps
      // its filters in the query string.
      navigate(url.pathname + url.search + url.hash, { replace: true });
    }
  }, [navigate]);

  // 換頁回到頂端。只看 pathname：/search 等頁面每改一個篩選條件就會改寫 query
  // string，那不是換頁，不該把人捲回去。
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ErrorBoundary>
      <Suspense
        fallback={<LoadingState className="py-24" label={t("頁面", "page")} />}
      >
        <Routes>
          <Route element={<IndexPage />} path="/" />
          <Route element={<CalendarPage />} path="/calendar" />
          <Route element={<MapPage />} path="/map" />
          <Route element={<SearchPage />} path="/search" />
          <Route element={<MySchedulePage />} path="/my-schedule" />
          <Route element={<SharedSchedulePage />} path="/share" />
          <Route element={<TeacherSchedulePage />} path="/schedules/teacher" />
          <Route element={<ClassSearchPage />} path="/schedules/class" />
          <Route element={<LocationSearchPage />} path="/schedules/location" />
          <Route element={<FreeRoomsPage />} path="/schedules/free-rooms" />
          <Route element={<TimetablePage />} path="/timetable" />
          <Route element={<NotFoundPage />} path="*" />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;

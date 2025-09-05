# Open Graph Implementation Test

This document describes the open graph support that has been implemented in the UTC Course Web application.

## Features Implemented

1. **Dynamic Meta Tags**: Each route now has unique meta tags that update dynamically when navigating between pages
2. **Open Graph Support**: Full og:title, og:description, og:type, og:url, and og:site_name support  
3. **Twitter Card Support**: Twitter Card meta tags for better social sharing
4. **SEO Optimization**: Proper title, description, keywords, and canonical URL for each page
5. **Traditional Chinese Content**: All descriptions are properly localized in Traditional Chinese

## Route-Specific Meta Tags

### Homepage (/)
- Title: "UTC 選課小幫手"
- Description: "臺北市立大學選課輔助工具，提供課程查詢、教師課表、校園地圖等功能，讓選課更便利！"
- Keywords: "臺北市立大學,選課,課程查詢,教師課表,校園地圖,UTC"

### Calendar Page (/calendar)
- Title: "課程行事曆 - UTC 選課小幫手"
- Description: "查看臺北市立大學課程行事曆，掌握重要學期日程與課程時間安排。"
- Keywords: "臺北市立大學,行事曆,課程時間,學期,UTC"

### Course Search (/search)
- Title: "課程查詢 - UTC 選課小幫手"
- Description: "搜尋臺北市立大學課程資訊，快速找到您需要的課程內容與修課資訊。"
- Keywords: "臺北市立大學,課程查詢,課程搜尋,修課,UTC"

### Teacher Schedule (/schedules/teacher)
- Title: "教師課表 - UTC 選課小幫手"
- Description: "查詢臺北市立大學教師課表，了解教師授課時間與課程安排。"
- Keywords: "臺北市立大學,教師課表,授課時間,教師查詢,UTC"

### Class Schedule (/schedules/class)
- Title: "系所課表 - UTC 選課小幫手"
- Description: "查看臺北市立大學各系所課表，掌握科系課程時間與教室安排。"
- Keywords: "臺北市立大學,系所課表,科系課程,教室,UTC"

### Location Schedule (/schedules/location)
- Title: "教室課表 - UTC 選課小幫手"
- Description: "查詢臺北市立大學教室使用狀況，了解各教室的課程安排與時間。"
- Keywords: "臺北市立大學,教室課表,教室查詢,場地,UTC"

### Campus Map (/map)
- Title: "校園地圖 - UTC 選課小幫手"
- Description: "臺北市立大學校園地圖，提供建築物位置與樓層平面圖，幫助您快速找到目的地。"
- Keywords: "臺北市立大學,校園地圖,建築物,樓層圖,導航,UTC"

### Timetable (/timetable)
- Title: "課程時刻表 - UTC 選課小幫手"
- Description: "查看臺北市立大學課程時刻表，了解各節次時間與課程安排。"
- Keywords: "臺北市立大學,時刻表,節次時間,課程安排,UTC"

### 404 Page (*)
- Title: "404 - 頁面找不到 | UTC 選課小幫手"
- Description: "抱歉，您所尋找的頁面不存在。返回 UTC 選課小幫手首頁繼續使用服務。"
- Robots: "noindex, nofollow" (prevents search engine indexing)

## Technical Implementation

The implementation uses a native DOM manipulation approach that is compatible with React 19, avoiding compatibility issues with react-helmet-async. The SEO component dynamically updates meta tags when the route changes using React's useEffect hook and useLocation from react-router-dom.

## Testing Verified

All routes have been tested to ensure:
- Page titles change dynamically
- Open Graph meta tags update correctly
- Twitter Card meta tags are properly set
- Canonical URLs are set for each page
- 404 pages properly use noindex/nofollow
- All content is in Traditional Chinese as required
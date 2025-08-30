# UTC Course Web Application

UTC Course Web (UTC 選課小幫手) is a React + TypeScript course management application for University of Taipei students. Built with Vite, HeroUI v2, and Tailwind CSS, it provides course search, scheduling, campus maps, and timetable information in Traditional Chinese.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test
- **ALWAYS use pnpm** (not npm or yarn): `pnpm --version` should show 10.14.0+
- Install dependencies: `pnpm install` -- takes 1-2 seconds
- Build the application: `pnpm run build` -- takes 15 seconds. **NEVER CANCEL**. Set timeout to 60+ seconds
- Lint and fix code: `pnpm run lint` -- takes 2-3 seconds
- **NO UNIT TESTS** - validation is done through build success and manual browser testing

### Run the Application
- Development server: `pnpm run dev` -- runs on http://localhost:5173/
- Preview built app: `pnpm run preview` -- runs on http://localhost:4173/
- **ALWAYS** test application functionality in browser after making changes
- Default development port: 5173, preview port: 4173

## Validation Scenarios

### CRITICAL: Manual Validation Required
After making ANY changes, **MUST** test complete user scenarios:

1. **Homepage Flow**: 
   - Navigate to http://localhost:5173/
   - Accept the disclaimer modal by clicking "我已了解並接受免責聲明"
   - Verify all navigation links work (首頁, 課程行事曆, 課程查詢, etc.)

2. **Core Functionality Test**:
   - Test course search page (/search) navigation
   - Verify theme toggle (dark/light mode switch) works
   - Ensure footer links to GitHub repositories are functional
   - Check mobile responsiveness

3. **Build Validation**:
   - Run `pnpm run build` and ensure it completes successfully
   - Check that `dist/` folder is created with assets
   - Verify `pnpm run preview` serves the built application correctly

### Never Cancel Build Operations
- **Build time**: 15 seconds typical, up to 60 seconds max
- **NEVER CANCEL** any build or long-running commands
- Set timeouts to 60+ minutes for builds, 30+ minutes for lint operations

## Common Tasks and Commands

### Essential Commands Reference
```bash
# Install dependencies (1-2 seconds)
pnpm install

# Development server (runs on :5173)
pnpm run dev

# Build for production (15 seconds - NEVER CANCEL)
pnpm run build

# Preview production build (:4173)  
pnpm run preview

# Lint and auto-fix
pnpm run lint
```

### Before Committing Changes
**ALWAYS** run these validation steps before you are done:
1. `pnpm run lint` -- must complete without errors or CI will fail
2. `pnpm run build` -- must complete successfully or CI will fail  
3. Manual browser testing of affected functionality
4. Check that no unintended files are staged for commit

## Key Architecture and File Locations

### Critical Source Directories
- `/src/pages/` - Main application pages (index, calendar, search, schedules, map, etc.)
- `/src/components/` - Reusable UI components including navigation, theme switching
- `/src/components/floorplans/` - Campus building floor plan components (SVG-based)
- `/src/layouts/` - Application layout components  
- `/src/styles/` - Global CSS and styling

### Configuration Files  
- `package.json` - Dependencies and scripts (uses pnpm 10.14.0)
- `vite.config.ts` - Vite bundler configuration
- `tailwind.config.js` - Tailwind CSS configuration with HeroUI theme
- `tsconfig.json` - TypeScript configuration with path aliases (@/*)
- `eslint.config.mjs` - ESLint configuration for React/TypeScript

### Build Output
- `dist/` - Production build output (created by `pnpm run build`)
- Deployed to GitHub Pages via `.github/workflows/vite-build.yml`

## Important Technology Details

### Framework Stack
- **React 19.1.1** with React Router for SPA navigation
- **TypeScript 5.9.2** with strict mode enabled
- **Vite 7.1.3** for fast development and building
- **HeroUI 2.8.2** component library (NOT Next.js - this is Vite!)
- **Tailwind CSS 4.1.12** for styling
- **Framer Motion 12.23.12** for animations

### Special Dependencies
- `react-pdf` for PDF document handling in course materials
- Traditional Chinese (`zh-TW`) internationalization
- SVG-based floor plans for campus navigation

### Package Manager Requirements
- **MUST use pnpm** - project configured with `pnpm@10.14.0`
- Uses `.npmrc` with `public-hoist-pattern[]=*@heroui/*` for HeroUI compatibility
- Lock file: `pnpm-lock.yaml` (not package-lock.json)

## Application-Specific Context

### Domain Knowledge
- **UTC** = University of Taipei (臺北市立大學)
- **選課小幫手** = Course Selection Helper
- Target users: University of Taipei students
- Interface language: Traditional Chinese (繁體中文)
- Features: course search, teacher schedules, campus maps, academic calendar

### Key Features and Pages
- `/` - Homepage with feature overview and disclaimer modal
- `/calendar` - Academic calendar and course schedules  
- `/search` - Course search and filtering (partially implemented)
- `/schedules/teacher` - Teacher schedule lookup
- `/schedules/class` - Class/department schedule lookup
- `/schedules/location` - Classroom/location schedule lookup
- `/map` - Interactive campus maps with building floor plans
- `/timetable` - University class period information

### UI/UX Patterns
- Dark/light theme toggle in navigation bar
- Disclaimer modal on first visit
- HeroUI components throughout (Button, Card, Input, etc.)
- Mobile-responsive design with Tailwind CSS
- Traditional Chinese text with proper typography

### Common Component Patterns
```typescript
// HeroUI imports
import { Button, Card } from "@heroui/react";

// Path aliases (@/* maps to src/*)  
import Component from "@/components/Component";
import { config } from "@/config/settings";

// SVG icon usage
import { SvgIcon } from "@/components/svgIcon";
```

## Troubleshooting

### Build Failures
- Check TypeScript errors: `tsc --noEmit`
- Clear cache: `rm -rf node_modules .vite dist && pnpm install`
- Ensure pnpm is used (not npm): check for `pnpm-lock.yaml`

### Development Issues  
- Port conflicts: Check if 5173 is available, or use `--port` flag
- HeroUI import errors: Verify `.npmrc` configuration is present
- SVG loading issues: Check that SVG files are in `public/` or properly imported

### Common File Locations for Quick Reference
```
├── .github/workflows/vite-build.yml  # CI/CD configuration
├── src/
│   ├── App.tsx                       # Main app router
│   ├── main.tsx                      # Application entry point
│   ├── pages/                        # Page components
│   ├── components/                   # Reusable UI components
│   └── styles/globals.css            # Global styles
├── dist/                             # Build output (gitignored)
├── package.json                      # Dependencies (pnpm)
├── vite.config.ts                    # Vite configuration  
└── tailwind.config.js                # Tailwind + HeroUI config
```

### Performance Notes
- Build typically takes 10-15 seconds
- Development server starts in under 1 second
- Hot reload is very fast due to Vite
- Large bundle size (~1.5MB) due to HeroUI - this is normal

Remember: This is a **student course management application** for University of Taipei. Always consider the academic context and Traditional Chinese language requirements when making changes.
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import { SelectedCoursesProvider } from "@/contexts/selected-courses-context.tsx";
import { WishlistProvider } from "@/contexts/wishlist-context.tsx";
import { LanguageProvider } from "@/i18n/language.tsx";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <Provider>
          <SelectedCoursesProvider>
            <WishlistProvider>
              <App />
            </WishlistProvider>
          </SelectedCoursesProvider>
        </Provider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

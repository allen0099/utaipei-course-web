import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import { SelectedCoursesProvider } from "@/contexts/selected-courses-context.tsx";
import { WishlistProvider } from "@/contexts/wishlist-context.tsx";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <SelectedCoursesProvider>
          <WishlistProvider>
            <App />
          </WishlistProvider>
        </SelectedCoursesProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
);

import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "@/app/App";
import { BookDetailPage } from "@/pages/BookDetailPage";
import { BooksPage } from "@/pages/BooksPage";
import { SettingsPage } from "@/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/books" replace /> },
      { path: "books", element: <BooksPage /> },
      { path: "books/:bookId", element: <BookDetailPage /> },
      { path: "settings", element: <SettingsPage /> }
    ]
  }
]);

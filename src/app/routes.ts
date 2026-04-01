import { createBrowserRouter } from "react-router";
import { Root } from "./layouts/Root";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { BooksList } from "./pages/BooksList";
import { BookReader } from "./pages/BookReader";
import { BookAdventure } from "./pages/BookAdventure";
import { AdminPanel } from "./pages/AdminPanel";
import { AdminBookForm } from "./pages/AdminBookForm";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "books", Component: BooksList },
      { path: "book/:id/read", Component: BookReader },
      { path: "book/:id/adventure", Component: BookAdventure },
      { path: "admin", Component: AdminPanel },
      { path: "admin/books/new", Component: AdminBookForm },
      { path: "admin/books/:id/edit", Component: AdminBookForm },
      { path: "*", Component: NotFound },
    ],
  },
]);
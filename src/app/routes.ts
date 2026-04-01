import { createBrowserRouter } from "react-router";
import { Root } from "./layouts/Root";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Onboarding } from "./pages/Onboarding";
import { IqTest } from "./pages/IqTest";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "onboarding", Component: Onboarding },
      { path: "iq-test", Component: IqTest },
      { path: "dashboard", Component: Dashboard },
      { path: "profile", Component: Profile },
      { path: "*", Component: NotFound },
    ],
  },
]);
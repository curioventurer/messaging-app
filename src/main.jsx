import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import Room from "./components/Room";
import FriendOverview from "./components/FriendOverview";
import UserList from "./components/UserList";
import SignUpForm from "./components/SignUpForm";
import LogInForm from "./components/LogInForm";
import "/node_modules/socket.io/client-dist/socket.io.js";
import "normalize.css";
import "./styles/main.css";

window.socket = window.io();

async function ensureAuthenticated() {
  const res = await fetch("/api/auth-status");
  const userInfo = await res.json();

  if (userInfo) return userInfo;
  else return redirect("/log-in");
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    id: "layout",
    loader: ensureAuthenticated,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/group/:groupId",
        element: <Room />,
      },
      {
        path: "/friend",
        element: <FriendOverview />,
      },
      {
        path: "/users",
        element: <UserList />,
      },
    ],
  },
  {
    path: "/sign-up",
    element: <SignUpForm />,
  },
  {
    path: "/log-in",
    element: <LogInForm />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

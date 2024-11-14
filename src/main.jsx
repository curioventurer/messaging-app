import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import Home from "./components/Home";
import ChatRoom from "./components/ChatRoom";
import SignUpForm from "./components/SignUpForm";
import LogInForm from "./components/LogInForm";
import "normalize.css";
import "./styles/main.css";

async function ensureAuthenticated() {
  const res = await fetch("/api/auth-status");
  const userInfo = await res.json();

  if (userInfo) return userInfo;
  else return redirect("/log-in");
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    loader: ensureAuthenticated,
  },
  {
    path: "/chat/:chatId",
    element: <ChatRoom />,
    loader: ensureAuthenticated,
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

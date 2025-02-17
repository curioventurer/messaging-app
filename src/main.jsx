import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import Title from "./components/Title";
import PublicInterface from "./components/PublicInterface";
import PrivateInterface from "./components/PrivateInterface";
import Home from "./components/Home";
import Room from "./components/Room";
import FriendOverview from "./components/FriendOverview";
import UserList from "./components/UserList";
import Intro from "./components/Intro";
import About from "./components/About";
import SignUpForm from "./components/SignUpForm";
import LogInForm from "./components/LogInForm";
import AppError from "./components/AppError";
import RouteError from "./components/RouteError";
import "/node_modules/socket.io/client-dist/socket.io.js";
import "normalize.css";
import "./styles/main.css";

//Fetch user, returns an object if logged in, else returns false.
async function getUser() {
  const res = await fetch("/api/auth-status");
  const user = await res.json();
  return user;
}

/*Only proceed with routing if logged in, else redirect to login page.
  Also returns user as loader data.
*/
async function ensureLoggedIn() {
  const user = await getUser();

  if (user) {
    //try socket io connect after login
    window.socket = window.io();

    return user;
  } else return redirect("/log-in");
}

//Only proceed with routing if logged out, else redirect to "/home".
async function ensureLoggedOut() {
  const user = await getUser();

  if (user) return redirect("/home");
  else return null;
}

//Perform logout and if successful, redirect to login page, else error page.
async function logout() {
  if (window.socket) window.socket.disconnect();

  const res = await fetch("/api/logout");
  const isSuccess = await res.json();

  if (isSuccess) return redirect("/log-in?msg=successful+logout");
  else return redirect("/error?err=logout");
}

const router = createBrowserRouter([
  {
    element: <PrivateInterface />,
    id: "interface",
    loader: ensureLoggedIn,
    children: [
      {
        path: "/home",
        element: (
          <Title title="Home">
            <Home />
          </Title>
        ),
      },
      {
        path: "/group/:chat_id",
        element: <Room isGroup={true} title />,
      },
      {
        path: "/chat/:chat_id",
        element: <Room isGroup={false} title />,
      },
      {
        path: "/friend",
        element: (
          <Title title="Friend">
            <FriendOverview />
          </Title>
        ),
      },
      {
        path: "/users",
        element: (
          <Title title="Users">
            <UserList />
          </Title>
        ),
      },
    ],
  },
  {
    element: <PublicInterface />,
    children: [
      {
        index: true,
        element: (
          <Title title="Intro">
            <Intro />
          </Title>
        ),
      },
      {
        path: "/about",
        element: (
          <Title title="About">
            <About />
          </Title>
        ),
      },
    ],
  },
  {
    path: "/sign-up",
    element: (
      <Title title="Signup">
        <SignUpForm />
      </Title>
    ),
    loader: ensureLoggedOut,
  },
  {
    path: "/log-in",
    element: (
      <Title title="Login">
        <LogInForm />
      </Title>
    ),
    loader: ensureLoggedOut,
  },
  {
    path: "/logout",
    loader: logout,
  },
  {
    path: "/error",
    element: (
      <Title title="App Error">
        <AppError />
      </Title>
    ),
  },
  {
    path: "*",
    element: (
      <Title title="Route Error">
        <RouteError />
      </Title>
    ),
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

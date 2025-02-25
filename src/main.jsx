import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import { io } from "socket.io-client";
import { User } from "../controllers/chat-data.js";

import Title from "./components/Title";
import PublicInterface from "./components/PublicInterface";
import PrivateInterface from "./components/PrivateInterface";
import Home from "./components/Home";
import Room from "./components/Room";
import FriendOverview from "./components/FriendOverview";
import UserList from "./components/UserList";
import Intro from "./components/Intro";
import About from "./components/About";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import AppError from "./components/AppError";
import RouteError from "./components/RouteError";
import Test from "./components/Test";

import "normalize.css";
import "./styles/main.css";

//Fetch user, the fetch returns an object if logged in, else returns false.
async function getUser() {
  const res = await fetch("/api/auth-status");
  const user = await res.json();

  if (user) return new User(user);
  else return false;
}

/*Only proceed with routing if logged in, else redirect to login page.
  Also returns user as loader data.
*/
async function ensureLoggedIn({ request }) {
  const user = await getUser();

  if (user) {
    //try socket io connect after login
    window.socket = io();

    return user;
  } else {
    const url = new URL(request.url);
    const redirectPath = url.pathname + url.search;

    return redirect("/login?rdr=" + encodeURIComponent(redirectPath));
  }
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

  if (isSuccess) return redirect("/login?msg=successful+logout");
  else return redirect("/error?err=logout");
}

const router = createBrowserRouter([
  {
    element: <PrivateInterface />,
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
    loader: getUser,
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
    path: "/register",
    element: (
      <Title title="Register">
        <RegisterForm />
      </Title>
    ),
    loader: ensureLoggedOut,
  },
  {
    path: "/login",
    element: (
      <Title title="Login">
        <LoginForm />
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
    //test code - load react component used for testing
    path: "/test",
    element: (
      <Title title="Test">
        <Test />
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

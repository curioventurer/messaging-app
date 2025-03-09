import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import { io } from "socket.io-client";
import { allLinks } from "./controllers/constant.js";
import { User } from "../js/chat-data.js";

import Title from "./components/layout/Title";
import PublicInterface from "./components/layout/PublicInterface.jsx";
import PrivateInterface from "./components/layout/PrivateInterface.jsx";
import Home from "./components/Home";
import Room from "./components/room/Room";
import FriendOverview from "./components/friend/FriendOverview";
import GroupList from "./components/group/GroupList";
import UserList from "./components/user/UserList.jsx";
import Intro from "./components/Intro";
import About from "./components/About";
import RegisterForm from "./components/auth/RegisterForm.jsx";
import LoginForm from "./components/auth/LoginForm";
import GuestLoginForm from "./components/auth/GuestLoginForm";
import AppError from "./components/sys/AppError.jsx";
import RouteError from "./components/sys/RouteError.jsx";
import Test from "./components/Test";

import "normalize.css";
import "./styles/main.scss";

//Fetch user from localStorage. If found, user is logged in, return user. Else, return false to indicate logged out.
async function getUser() {
  const user = JSON.parse(localStorage.getItem("user"));
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

    return redirect(
      allLinks.login.href + "?rdr=" + encodeURIComponent(redirectPath),
    );
  }
}

//Only proceed with routing if logged out, else redirect to home.
async function ensureLoggedOut() {
  const user = await getUser();

  if (user) return redirect(allLinks.home.href);
  else return null;
}

//Perform logout and if successful, redirect to login page, else error page.
async function logout() {
  if (window.socket) window.socket.disconnect();
  localStorage.removeItem("user");

  const res = await fetch("/api/logout");
  const isSuccess = await res.json();

  if (isSuccess)
    return redirect(allLinks.login.href + "?msg=successful+logout");
  else return redirect("/error?err=logout");
}

const router = createBrowserRouter([
  {
    element: <PrivateInterface />,
    loader: ensureLoggedIn,
    children: [
      {
        path: allLinks.home.href,
        element: (
          <Title title={allLinks.home.name}>
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
        path: allLinks.friend.href,
        element: (
          <Title title={allLinks.friend.name}>
            <FriendOverview />
          </Title>
        ),
      },
      {
        path: allLinks.groups.href,
        element: (
          <Title title={allLinks.groups.name}>
            <GroupList />
          </Title>
        ),
      },
      {
        path: allLinks.users.href,
        element: (
          <Title title={allLinks.users.name}>
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
          <Title title={allLinks.index.name}>
            <Intro />
          </Title>
        ),
      },
      {
        path: allLinks.about.href,
        element: (
          <Title title={allLinks.about.name}>
            <About />
          </Title>
        ),
      },
    ],
  },
  {
    path: allLinks.register.href,
    element: (
      <Title title={allLinks.register.name}>
        <RegisterForm />
      </Title>
    ),
    loader: ensureLoggedOut,
  },
  {
    path: allLinks.login.href,
    element: (
      <Title title={allLinks.login.name}>
        <LoginForm />
      </Title>
    ),
    loader: ensureLoggedOut,
  },
  {
    path: allLinks.guestLogin.href,
    element: (
      <Title title={allLinks.guestLogin.name}>
        <GuestLoginForm />
      </Title>
    ),
    loader: ensureLoggedOut,
  },
  {
    path: allLinks.logout.href,
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

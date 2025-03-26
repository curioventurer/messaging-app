import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { allLinks } from "./controllers/constant.js";

import App from "./components/sys/App.jsx";
import LoginWrapper from "./components/sys/LoginWrapper.jsx";
import LogoutWrapper from "./components/sys/LogoutWrapper.jsx";
import Logout from "./components/sys/Logout.jsx";
import Title from "./components/layout/Title.jsx";
import PublicInterface from "./components/layout/PublicInterface.jsx";
import PrivateInterface from "./components/layout/PrivateInterface.jsx";
import Home from "./components/home/Home.jsx";
import Profile from "./components/profile/Profile.jsx";
import Room from "./components/room/Room.jsx";
import GroupList from "./components/group/GroupList.jsx";
import UserList from "./components/user/UserList.jsx";
import CreateGroup from "./components/form/CreateGroup.jsx";
import Intro from "./components/Intro.jsx";
import About from "./components/About.jsx";
import RegisterForm from "./components/form/RegisterForm.jsx";
import LoginForm from "./components/form/LoginForm.jsx";
import GuestLoginForm from "./components/form/GuestLoginForm.jsx";
import AppError from "./components/sys/AppError.jsx";
import RouteError from "./components/sys/RouteError.jsx";
import Test from "./components/Test.jsx";

import "normalize.css";
import "./styles/main.scss";

const router = createBrowserRouter([
  {
    element: <LogoutWrapper />,
    children: [
      {
        path: allLinks.logout.href,
        element: <Logout />,
      },
      {
        element: <PrivateInterface />,
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
            path: allLinks.profile.href,
            element: <Profile own />,
          },
          {
            path: `${allLinks.profile.href}/:user_id`,
            element: <Profile />,
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
            path: allLinks.groupList.href,
            element: (
              <Title title={allLinks.groupList.name}>
                <GroupList />
              </Title>
            ),
          },
          {
            path: allLinks.userList.href,
            element: (
              <Title title={allLinks.userList.name}>
                <UserList />
              </Title>
            ),
          },
          {
            path: allLinks.createGroup.href,
            element: (
              <Title title={allLinks.createGroup.name}>
                <CreateGroup />
              </Title>
            ),
          },
        ],
      },
    ],
  },
  {
    element: <LoginWrapper />,
    children: [
      {
        path: allLinks.register.href,
        element: (
          <Title title={allLinks.register.name}>
            <RegisterForm />
          </Title>
        ),
      },
      {
        path: allLinks.login.href,
        element: (
          <Title title={allLinks.login.name}>
            <LoginForm />
          </Title>
        ),
      },
      {
        path: allLinks.guestLogin.href,
        element: (
          <Title title={allLinks.guestLogin.name}>
            <GuestLoginForm />
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
    <App>
      <RouterProvider router={router} />
    </App>
  </StrictMode>,
);

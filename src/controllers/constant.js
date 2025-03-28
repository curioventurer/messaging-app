import { LinkClass } from "../../js/chat-data.js";

export const boolType = {
  FALSE: 0,
  TRUE: 1,
  TOGGLE: 2,
};

export const searchType = {
  STRING: "string",
  BOOL: "bool",
  ARRAY: "array",
};

export const allLinks = {
  index: { href: "/", name: "Intro", classes: [] },
  logout: { href: "/logout", name: "Logout", classes: ["important-link"] },
  login: { href: "/login", name: "Login", classes: ["important-link"] },
  guestLogin: {
    href: "/guest-login",
    name: "Guest Login",
    classes: ["important-link"],
  },
  register: {
    href: "/register",
    name: "Register",
    classes: ["important-link"],
  },
  home: new LinkClass({
    href: "/home",
    name: "Home",
    classes: ["private-link"],
    search: {
      chat: { param: "", name: "Chat", classes: [] },
      group: { param: "?tab=group", name: "Group", classes: [] },
      friend: { param: "?tab=friend", name: "Friend", classes: [] },
    },
  }),
  profile: {
    href: "/profile",
    name: "Profile",
    classes: ["private-link"],
  },
  groupList: {
    href: "/group-list",
    name: "Group List",
    classes: ["private-link"],
  },
  userList: {
    href: "/user-list",
    name: "User List",
    classes: ["private-link"],
  },
  createGroup: {
    href: "/create-group",
    name: "Create Group",
    classes: [],
  },
  about: { href: "/about", name: "About", classes: [] },
};

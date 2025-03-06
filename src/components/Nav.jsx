import { useContext, memo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { InterfaceContext } from "./PrivateInterface";

const allLinks = {
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
  home: { href: "/home", name: "Home", classes: ["private-link"] },
  friend: { href: "/friend", name: "Friend", classes: ["private-link"] },
  users: { href: "/users", name: "Users", classes: ["private-link"] },
  about: { href: "/about", name: "About", classes: [] },
};

function Nav({ isPublic = false }) {
  const client = useContext(InterfaceContext);

  //Additional links shown when logged out.
  const loggedOutLinks = [
    allLinks.register,
    allLinks.guestLogin,
    allLinks.login,
  ];

  //Additional links shown when logged in.
  const loggedInLinks = [allLinks.logout];

  //Links exposed to PrivateInterface(for logged in users).
  const privateLinks = [
    allLinks.home,
    allLinks.friend,
    allLinks.users,
    allLinks.index,
    allLinks.logout,
  ];

  //Links exposed to PublicInterface(for both public and logged in users).
  const publicLinks = [
    client ? allLinks.home : null,
    allLinks.index,
    allLinks.about,
    ...(client ? loggedInLinks : loggedOutLinks),
  ];

  let links = isPublic ? publicLinks : privateLinks;
  links = links.filter((link) => link !== null); //remove null elements from array.

  return (
    <nav>
      <ul className="button-bar">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              to={link.href}
              className={"button-link" + " " + link.classes.join(" ")}
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

Nav.propTypes = {
  isPublic: PropTypes.bool,
};

export default memo(Nav);

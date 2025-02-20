import { useContext, memo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { InterfaceContext } from "./PrivateInterface";

const allLinks = {
  index: { href: "/", name: "Intro", classes: [] },
  logout: { href: "/logout", name: "Logout", classes: ["important-link"] },
  login: { href: "/login", name: "Login", classes: ["important-link"] },
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

//Links exposed to PrivateInterface(for logged in users).
const privateLinks = [
  allLinks.home,
  allLinks.friend,
  allLinks.users,
  allLinks.index,
];

//Links exposed to PublicInterface(for both public and logged in users).
const publicLinks = [allLinks.index, allLinks.about];

//Additional links shown when logged in.
const loggedInLinks = [allLinks.logout];

//Additional links shown when logged out.
const loggedOutLinks = [allLinks.register, allLinks.login];

function Nav({ isPublic = false }) {
  const client = useContext(InterfaceContext);

  const links = [
    ...(isPublic ? publicLinks : privateLinks),
    ...(client ? loggedInLinks : loggedOutLinks),
  ];

  //If using public interface while logged in, add home link to switch to private interface.
  if (isPublic && client) {
    links.unshift(allLinks.home);
  }

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

import { memo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

//Links exposed to PrivateInterface(for logged in users).
const privateLinks = [
  { href: "/home", name: "Home", classes: ["private-link"] },
  { href: "/friend", name: "Friend", classes: ["private-link"] },
  { href: "/users", name: "Users", classes: ["private-link"] },
  { href: "/", name: "Intro", classes: ["public-link"] },
  { href: "/about", name: "About", classes: ["public-link"] },
  { href: "/logout", name: "Logout", classes: ["important-link"] },
];

//Links exposed to PublicInterface(for public users).
const publicLinks = [
  { href: "/", name: "Intro", classes: ["public-link"] },
  { href: "/about", name: "About", classes: ["public-link"] },
  { href: "/log-in", name: "Login", classes: ["important-link"] },
  { href: "/sign-up", name: "Signup", classes: ["important-link"] },
];

function Nav({ isPublic = false }) {
  const links = isPublic ? publicLinks : privateLinks;

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

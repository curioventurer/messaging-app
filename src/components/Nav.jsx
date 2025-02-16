import { memo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

//Links exposed to PrivateInterface(for logged in users).
const privateLinks = [
  { href: "/home", name: "Home" },
  { href: "/friend", name: "Friend" },
  { href: "/users", name: "Users" },
  { href: "/", name: "Intro" },
  { href: "/about", name: "About" },
  { href: "/logout", name: "Logout" },
];

//Links exposed to PublicInterface(for public users).
const publicLinks = [
  { href: "/", name: "Intro" },
  { href: "/about", name: "About" },
  { href: "/log-in", name: "Login" },
  { href: "/sign-up", name: "Signup" },
];

function Nav({ isPublic = false }) {
  const links = isPublic ? publicLinks : privateLinks;

  return (
    <nav>
      <ul className="button-bar">
        {links.map((link) => (
          <li key={link.href}>
            <Link to={link.href} className="button-link">
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

import { useContext, memo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { InterfaceContext } from "./PrivateInterface";
import { allLinks } from "../../controllers/constant.js";

function Nav({ isPublic = false }) {
  const { client } = useContext(InterfaceContext);

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
    allLinks.groupList,
    allLinks.userList,
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

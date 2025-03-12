import { memo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { allLinks } from "../../controllers/constant.js";

function HomeNav({ link_param }) {
  const page = allLinks.home;
  const links = Object.values(page.search);

  return (
    <nav className="tabs">
      <ul className="button-bar">
        {links.map((link) => (
          <li key={link.param}>
            <Link
              to={link.href}
              className={
                "button-link" +
                " " +
                link.classes.join(" ") +
                (link.param === link_param ? " active" : "")
              }
              replace
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

HomeNav.propTypes = {
  link_param: PropTypes.string.isRequired,
};

export default memo(HomeNav);

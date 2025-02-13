import { memo } from "react";
import { Link } from "react-router-dom";

function Nav() {
  return (
    <nav>
      <ul className="button-bar">
        <li>
          <Link to="/" className="button-link">
            Home
          </Link>
        </li>
        <li>
          <Link to="/friend" className="button-link">
            Friend
          </Link>
        </li>
        <li>
          <Link to="/users" className="button-link">
            Users
          </Link>
        </li>
        <li>
          <a href="/log-out" className="button-link">
            Log Out
          </a>
        </li>
      </ul>
    </nav>
  );
}

export default memo(Nav);

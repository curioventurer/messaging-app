import { Link } from "react-router-dom";

function Nav() {
  return (
    <nav>
      <ul>
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
        <li>
          <Link to="/log-in" className="button-link">
            Log In
          </Link>
        </li>
        <li>
          <Link to="/sign-up" className="button-link">
            Sign Up
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Nav;

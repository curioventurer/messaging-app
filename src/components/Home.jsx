import { Link, useLoaderData } from "react-router-dom";
import ChatList from "./ChatList";

function Home() {
  const userData = useLoaderData();

  return (
    <>
      <p>Welcome {userData.username}, to our messaging app!</p>
      <nav>
        <ul>
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
      <ChatList />
    </>
  );
}

export default Home;

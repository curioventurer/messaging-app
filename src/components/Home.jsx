import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ChatItem from "./ChatItem";

function Home() {
  let [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetch("/api/chats")
      .then((res) => res.json())
      .then((data) => setRooms(data));

    return () => {};
  }, []);

  return (
    <>
      <p>Welcome to our messaging app!</p>
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
      <ul className="chat-list">
        {rooms.map((room) => (
          <li key={room.id}>
            <ChatItem room={room} />
          </li>
        ))}
      </ul>
    </>
  );
}

export default Home;

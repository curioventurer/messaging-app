import { useEffect, useState } from "react";
import ChatItem from "./ChatItem";

function ChatList() {
  let [rooms, setRooms] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/chats", { signal: controller.signal });

    fetch(request)
      .then((res) => res.json())
      .then((data) => setRooms(data))
      .catch(() => {});

    return () => {
      controller.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, []);

  return (
    <ul className="chat-list left-screen">
      {rooms.map((room) => (
        <li key={room.id}>
          <ChatItem room={room} />
        </li>
      ))}
    </ul>
  );
}

export default ChatList;

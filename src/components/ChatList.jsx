import { useEffect, useState } from "react";
import ChatItem from "./ChatItem.jsx";
import sortChats from "../controllers/sortChats.js";

function isGroupChat(chat) {
  return Boolean(chat.id);
}

function ChatList() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/chats", { signal: controller.signal });

    fetch(request)
      .then((res) => res.json())
      .then((data) => setChats(sortChats(data)))
      .catch(() => {});

    return () => {
      controller.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, []);

  useEffect(() => {
    window.socket.on("message", updateLastMsg);

    return () => {
      window.socket.off("message", updateLastMsg);
    };
  }, []);

  function updateLastMsg(message) {
    setChats((prevChats) => {
      const index = prevChats.findIndex((chat) => {
        if (isGroupChat(chat)) return chat.id === message.group_id;
        else return chat.user_id === message._id;
      });
      if (index === -1) return prevChats;

      const updatedChat = { ...prevChats[index], lastMessage: message };
      const newChats = sortChats([
        updatedChat,
        ...prevChats.slice(0, index),
        ...prevChats.slice(index + 1),
      ]);

      return newChats;
    });
  }

  return (
    <ul className="chat-list room-left-screen">
      {chats.map((chat) => (
        <li key={isGroupChat(chat) ? "g" + chat.id : "p" + chat.user_id}>
          <ChatItem chat={chat} isGroupChat={isGroupChat(chat)} />
        </li>
      ))}
    </ul>
  );
}

export default ChatList;

import { useEffect, useState } from "react";
import ChatItem from "./ChatItem.jsx";
import sortChats from "../controllers/sortChats.js";
import { Message, NewMessage } from "../controllers/chat-data.js";

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

  function updateLastMsg(messageData = new NewMessage({})) {
    const newMessage = new NewMessage({
      ...messageData,
      message: new Message(messageData.message),
    });

    setChats((prevChats) => {
      const index = prevChats.findIndex((chat) => {
        if (isGroupChat(chat) === newMessage.isGroupChat) {
          if (isGroupChat(chat)) return chat.id === newMessage.chat_id;
          else return chat.user_id === newMessage.chat_id;
        }
      });
      if (index === -1) return prevChats;

      const updatedChat = {
        ...prevChats[index],
        lastMessage: newMessage.message,
      };
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
          <ChatItem chat={chat} isGroup={isGroupChat(chat)} />
        </li>
      ))}
    </ul>
  );
}

export default ChatList;

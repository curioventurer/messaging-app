import { useEffect, useState } from "react";
import ChatItem from "./ChatItem.jsx";
import sortChats from "../controllers/sortChats.js";
import { ChatId, Message, NewMessage } from "../controllers/chat-data.js";

function ChatList() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/chats", { signal: controller.signal });

    fetch(request)
      .then((res) => res.json())
      .then((data) => {
        data = data.map((item) => {
          return {
            ...item,
            lastMessage: item.lastMessage
              ? new Message(item.lastMessage)
              : null,
          };
        });
        setChats(sortChats(data));
      })
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
      chatId: new ChatId(messageData.chatId),
      message: new Message(messageData.message),
    });

    setChats((prevChats) => {
      const index = prevChats.findIndex((chat) => {
        const chatId = new ChatId({
          id: chat.id,
          isGroup: chat.isGroup,
        });
        return (
          chatId.id === newMessage.chatId.id &&
          chatId.isGroup === newMessage.chatId.isGroup
        );
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
        <li key={(chat.isGroup ? "g" : "d") + chat.id}>
          <ChatItem chat={chat} />
        </li>
      ))}
    </ul>
  );
}

export default ChatList;

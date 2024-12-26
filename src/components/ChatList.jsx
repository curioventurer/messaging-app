import { useContext } from "react";
import ChatItem from "./ChatItem.jsx";
import { ChatContext } from "./Layout.jsx";

function ChatList() {
  const { chats } = useContext(ChatContext);

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

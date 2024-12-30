import { useContext } from "react";
import ChatItem from "./ChatItem.jsx";
import { ChatContext } from "./Layout.jsx";

function ChatList() {
  const { chats } = useContext(ChatContext);

  return (
    <ul className="chat-list">
      {chats.map((chat) => (
        <li key={(chat.chatId.isGroup ? "g" : "d") + chat.chatId.id}>
          <ChatItem chat={chat} />
        </li>
      ))}
    </ul>
  );
}

export default ChatList;

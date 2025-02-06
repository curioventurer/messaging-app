import { useContext } from "react";
import ChatItem from "./ChatItem.jsx";
import { ChatListContext } from "./Layout.jsx";

function ChatList() {
  const { chats } = useContext(ChatListContext);

  return (
    <ul className="chat-list narrow-width low-priority-display">
      {chats.map((chat) => (
        <li key={(chat.chatId.isGroup ? "g" : "d") + chat.chatId.id}>
          <ChatItem chat={chat} />
        </li>
      ))}
    </ul>
  );
}

export default ChatList;

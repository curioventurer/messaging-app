import { useRef, useContext } from "react";
import ChatItem from "./ChatItem.jsx";
import { ChatContext } from "./Layout.jsx";
import { LayoutContext } from "./Layout.jsx";

function ChatList() {
  const { chats } = useContext(ChatContext);
  const { isMenuVisible } = useContext(LayoutContext);
  const scrollTopRef = useRef(0);

  //when menu is open, disable scrolling by scrolling back to previous recorded position
  function handleScroll(event) {
    if (isMenuVisible) event.target.scrollTo({ top: scrollTopRef.current });
    else scrollTopRef.current = event.target.scrollTop;
  }

  return (
    <ul onScroll={handleScroll} className="chat-list">
      {chats.map((chat) => (
        <li key={(chat.chatId.isGroup ? "g" : "d") + chat.chatId.id}>
          <ChatItem chat={chat} />
        </li>
      ))}
    </ul>
  );
}

export default ChatList;

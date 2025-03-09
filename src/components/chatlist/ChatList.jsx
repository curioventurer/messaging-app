import { useContext, memo } from "react";
import ChatItem from "./ChatItem";
import Loading from "../sys/Loading";
import LoadFail from "../sys/LoadFail";
import LoadError from "../sys/LoadError";
import { ChatListContext } from "../layout/PrivateInterface";

function ChatList() {
  const chats = useContext(ChatListContext);
  let content;

  if (chats === undefined) content = <Loading name="chat list" />;
  else if (chats === null) content = <LoadFail name="chat list" />;
  else if (chats === false) content = <LoadError name="chat list" />;
  else if (chats.length === 0) content = "no content";
  else
    content = chats.map((chat) => (
      <li key={(chat.chatId.isGroup ? "g" : "d") + chat.chatId.id}>
        <ChatItem chat={chat} />
      </li>
    ));

  return (
    <ul className="chat-list narrow-width low-priority-display">{content}</ul>
  );
}

export default memo(ChatList);

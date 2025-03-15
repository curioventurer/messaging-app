import { useContext, memo } from "react";
import PropTypes from "prop-types";
import ChatItem from "./ChatItem.jsx";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import { ChatListContext } from "../layout/PrivateInterface.jsx";

function ChatList({ roomInfoIsShown = false }) {
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
    <ul
      className={
        "chat-list narrow-width low-priority-display" +
        (roomInfoIsShown ? " remove" : "")
      }
    >
      {content}
    </ul>
  );
}

ChatList.propTypes = {
  roomInfoIsShown: PropTypes.bool,
};

export default memo(ChatList);

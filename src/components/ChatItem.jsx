import { useContext } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { GroupContext } from "./Room.jsx";
import DateFormat from "../controllers/DateFormat.js";

function ChatItem({ chat, isGroup }) {
  const { isGroupChat, chat_id } = useContext(GroupContext);
  const lastMessage = chat.lastMessage;

  const created = lastMessage ? lastMessage.created : chat.joined;
  const displayDate = DateFormat.timestamp(created);

  let shownMessage;
  if (lastMessage)
    shownMessage = isGroup
      ? `${lastMessage.name}: ${lastMessage.text}`
      : lastMessage.text;
  else shownMessage = isGroup ? "Joined group" : "Chat created";

  let isActive = false;
  if (
    (isGroup && chat_id === chat.id && isGroupChat) ||
    (!isGroup && chat_id === chat.user_id && !isGroupChat)
  )
    isActive = true;

  return (
    <Link
      to={isGroup ? "/group/" + chat.id : "/chat/" + chat.user_id}
      className={"button-link" + (isActive ? " button-highlight" : "")}
    >
      <div className="chat-item-header">
        <p>{chat.name}</p>
        <time dateTime={created}>{displayDate}</time>
      </div>
      <p className="clipped-text">{shownMessage}</p>
    </Link>
  );
}

ChatItem.propTypes = {
  chat: PropTypes.object.isRequired,
  isGroup: PropTypes.bool.isRequired,
};

export default ChatItem;

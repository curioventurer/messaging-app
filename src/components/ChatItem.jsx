import { useContext } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { GroupContext } from "./Room.jsx";
import DateFormat from "../controllers/DateFormat.js";

function ChatItem({ chat }) {
  const { chatId } = useContext(GroupContext);
  const lastMessage = chat.lastMessage;

  const date = lastMessage
    ? lastMessage.created
    : (chat.joined ?? chat.time_shown);
  const displayDate = DateFormat.timestamp(date);

  let shownMessage;
  if (lastMessage)
    shownMessage = chat.isGroup
      ? `${lastMessage.name}: ${lastMessage.text}`
      : lastMessage.text;
  else shownMessage = chat.isGroup ? "Joined group" : "Chat created";

  let isActive = false;
  if (chat.id === chatId.id && chat.isGroup === chatId.isGroup) isActive = true;

  return (
    <Link
      to={(chat.isGroup ? "/group/" : "/chat/") + chat.id}
      className={"button-link" + (isActive ? " button-highlight" : "")}
    >
      <div className="chat-item-header">
        <p>{chat.name}</p>
        <time dateTime={date}>{displayDate}</time>
      </div>
      <p className="clipped-text">{shownMessage}</p>
    </Link>
  );
}

ChatItem.propTypes = {
  chat: PropTypes.object.isRequired,
};

export default ChatItem;

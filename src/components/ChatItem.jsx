import { useContext } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { ChatIdContext } from "./ChatRoom.jsx";
import DateFormat from "../controllers/DateFormat.js";

function ChatItem({ room }) {
  const chatId = useContext(ChatIdContext);
  const lastMessage = room.lastMessage;

  const created = lastMessage ? lastMessage.created : room.created;
  const displayDate = DateFormat.timestamp(created);

  return (
    <Link
      to={"/chat/" + room.id}
      className={
        "button-link" + (chatId === room.id ? " button-highlight" : "")
      }
    >
      <div className="chat-item-header">
        <p>{room.name}</p>
        <time dateTime={created}>{displayDate}</time>
      </div>
      <p className="chat-item-message">
        {lastMessage
          ? `${lastMessage.username}: ${lastMessage.text}`
          : "Chatroom created"}
      </p>
    </Link>
  );
}

ChatItem.propTypes = {
  room: PropTypes.object.isRequired,
};

export default ChatItem;

import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import DateFormat from "../controllers/DateFormat.js";

function ChatItem({ room }) {
  const lastMessage = room.lastMessage;

  const created = lastMessage ? lastMessage.created : room.created;
  const displayDate = DateFormat.timestamp(created);

  return (
    <Link to={"/chat/" + room.id} className="button-link">
      <div className="chat-item-header">
        <p>{room.name}</p>
        <time dateTime={created}>{displayDate}</time>
      </div>
      {lastMessage ? (
        <p>
          {lastMessage.username}: {lastMessage.text}
        </p>
      ) : (
        <p>Chatroom created</p>
      )}
    </Link>
  );
}

ChatItem.propTypes = {
  room: PropTypes.object.isRequired,
};

export default ChatItem;

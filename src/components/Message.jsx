import PropTypes from "prop-types";
import DateFormat from "../controllers/DateFormat.js";

function Message({ message, userId, isJoined = false }) {
  const isUser = userId === message.user_id;

  let liClass = "message-box";
  if (isUser) liClass += " user-owned";
  if (isJoined) liClass += " joined-message";

  let sentStatus = "sending";

  return (
    <li className={liClass}>
      {isJoined || isUser ? null : (
        <p className="message-sender">{message.username}</p>
      )}
      <div>
        <p>{message.text}</p>
        <p className="message-footer">
          <time dateTime={message.created}>
            {DateFormat.time(message.created)}
          </time>
          {message.id > 0 ? null : " - " + sentStatus}
        </p>
      </div>
    </li>
  );
}

Message.propTypes = {
  message: PropTypes.object.isRequired,
  userId: PropTypes.number.isRequired,
  isJoined: PropTypes.bool,
};

export default Message;

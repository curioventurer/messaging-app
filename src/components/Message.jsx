import { useContext } from "react";
import PropTypes from "prop-types";
import { GroupContext } from "./Room.jsx";
import DateFormat from "../controllers/DateFormat.js";

function Message({ message, isJoined = false }) {
  const { userData } = useContext(GroupContext);

  const isUser = userData.id === message.user_id;

  let liClass = "message-box";
  if (isUser) liClass += " user-owned";
  if (isJoined) liClass += " joined-message";

  let sentStatus = "sending";

  return (
    <li className={liClass}>
      {isJoined || isUser ? null : (
        <p className="message-sender">{message.name}</p>
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
  isJoined: PropTypes.bool,
};

export default Message;

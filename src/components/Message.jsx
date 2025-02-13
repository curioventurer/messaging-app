import { useContext, memo } from "react";
import PropTypes from "prop-types";
import { RoomContext } from "./Room.jsx";
import DateFormat from "../../controllers/DateFormat.js";
import { Message as MessageData } from "../../controllers/chat-data.js";

const SENT_STATUS_TEXT = "sending";

function Message({ message, isJoined = false }) {
  const { client, chatId } = useContext(RoomContext);
  const isUser = client.id === message.user_id;

  let liClass = "message-box";
  if (isUser) liClass += " user-owned";
  if (isJoined) liClass += " joined-message";

  let isNameShown;
  if (isJoined || isUser || !chatId.isGroup) isNameShown = false;
  else isNameShown = true;

  return (
    <li className={liClass}>
      {isNameShown ? (
        <p className="message-sender clipped-text">{message.name}</p>
      ) : null}
      <div>
        <p>{message.text}</p>
        <p className="message-footer">
          <time dateTime={message.created}>
            {DateFormat.time(message.created)}
          </time>
          {message.id >= 0 ? null : " - " + SENT_STATUS_TEXT}
        </p>
      </div>
    </li>
  );
}

Message.propTypes = {
  message: PropTypes.instanceOf(MessageData).isRequired,
  isJoined: PropTypes.bool,
};

export default memo(Message);

import { useContext } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { LayoutContext } from "./Layout.jsx";
import { ChatContext } from "./Room.jsx";
import DateFormat from "../controllers/DateFormat.js";
import { ChatItemData } from "../controllers/chat-data.js";

function ChatItem({ chat = new ChatItemData({}) }) {
  const { openMenu } = useContext(LayoutContext);
  const { chatId } = useContext(ChatContext);

  const hasLastMessage = chat.lastMessage.id !== 0;

  const date = chat.selectTime();
  const displayDate = DateFormat.timestamp(date);

  let shownMessage;
  if (hasLastMessage)
    shownMessage = chat.chatId.isGroup
      ? `${chat.lastMessage.name}: ${chat.lastMessage.text}`
      : chat.lastMessage.text;
  else shownMessage = chat.chatId.isGroup ? "Joined group" : "Chat created";

  let isActive = false;
  if (chat.chatId.id === chatId.id && chat.chatId.isGroup === chatId.isGroup)
    isActive = true;

  return (
    <>
      <Link
        to={(chat.chatId.isGroup ? "/group/" : "/chat/") + chat.chatId.id}
        className={"button-link" + (isActive ? " button-highlight" : "")}
      >
        <div className="chat-item-header">
          <p>{chat.name}</p>
          <div className="right-side">
            <time dateTime={date}>{displayDate}</time>
            <button onClick={openMenu} data-chat={JSON.stringify(chat.chatId)}>
              ⋮
            </button>
          </div>
        </div>
        <p className="clipped-text">{shownMessage}</p>
      </Link>
    </>
  );
}

ChatItem.propTypes = {
  chat: PropTypes.instanceOf(ChatItemData).isRequired,
};

export default ChatItem;

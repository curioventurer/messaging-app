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
  const displayDate = DateFormat.timestamp(date, true);

  let shownMessage = [];
  if (hasLastMessage) {
    if (chat.chatId.isGroup) {
      shownMessage.push(
        <span key="name" className="clipped-text chat-item-name">
          {chat.lastMessage.name}
        </span>,
      );
      shownMessage.push(
        <span key="separator" className="chat-item-separator">
          :{" "}
        </span>,
      );
    }
    shownMessage.push(
      <span key="message" className="clipped-text chat-item-text">
        {chat.lastMessage.text}
      </span>,
    );
  } else
    shownMessage.push(chat.chatId.isGroup ? "Joined group" : "Chat created");

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
          <p className="clipped-text">{chat.name}</p>
          <div className="chat-item-header-right">
            <time dateTime={date}>{displayDate}</time>
            <button onClick={openMenu} data-chat={JSON.stringify(chat.chatId)}>
              ⋮
            </button>
          </div>
        </div>
        <p className="chat-item-content">{shownMessage}</p>
      </Link>
    </>
  );
}

ChatItem.propTypes = {
  chat: PropTypes.instanceOf(ChatItemData).isRequired,
};

export default ChatItem;

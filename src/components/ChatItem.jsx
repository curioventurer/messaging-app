import { useState, useEffect, useRef, useContext, memo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import ChatItemMenu from "./ChatItemMenu";
import { MenuContext } from "./PrivateInterface";
import { RoomContext } from "./Room";
import DateFormat from "../controllers/DateFormat.js";
import updateRect from "../controllers/updateRect.js";
import { ChatItemData } from "../../js/chat-data.js";

function ChatItem({ chat = new ChatItemData({}) }) {
  const { isMenuVisible, menuChatId, openMenu } = useContext(MenuContext);
  const { chatId } = useContext(RoomContext);

  /*menuContRect is used to position ChatItemMenu relative to it's containing block.
    menuButtonRect is used to position ChatItemMenu near the button.
  */
  const [menuContRect, setMenuContRect] = useState(new DOMRect());
  const [menuButtonRect, setMenuButtonRect] = useState(new DOMRect());

  const [isMenuShown, setIsMenuShown] = useState(false);

  const menuContRef = useRef(null);
  const menuButtonRef = useRef(null);

  //Show this specific menu only if menu is visible, and the menu chatId matches this chatId.
  useEffect(() => {
    if (isMenuVisible && menuChatId.isEqual(chat.chatId)) {
      const DELAY = 0;
      updateAllRect();

      //Delay showing the menu, to wait for updateAllRect() to finish updating the state, so that the menu is rendered with updated states.
      const timeout = setTimeout(() => {
        setIsMenuShown(true);
      }, DELAY);

      return () => {
        clearTimeout(timeout);
      };
    } else setIsMenuShown(false);
  }, [isMenuVisible, menuChatId, chat.chatId]);

  //update rect at intervals, only when menu is shown.
  useEffect(() => {
    const DELAY = 250;

    if (!isMenuShown) return;

    updateAllRect();

    const interval = setInterval(updateAllRect, DELAY);

    return () => {
      clearInterval(interval);
    };
  }, [isMenuShown]);

  function updateAllRect() {
    updateRect(setMenuContRect, menuContRef.current);
    updateRect(setMenuButtonRect, menuButtonRef.current);
  }

  const hasLastMessage = chat.lastMessage.isDefined();

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
        <span key="separator" className="chat-item-separator pre-wrap">
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
  if (chat.chatId.isEqual(chatId)) isActive = true;

  return (
    <Link
      to={(chat.chatId.isGroup ? "/group/" : "/chat/") + chat.chatId.id}
      className={"button-link" + (isActive ? " highlight" : "")}
    >
      <div className="chat-item-header">
        <p className="clipped-text">{chat.name}</p>
        <div ref={menuContRef} className="chat-item-header-right">
          <time dateTime={date}>{displayDate}</time>
          <button
            aria-label="menu"
            className="icon clear-background"
            ref={menuButtonRef}
            onClick={(event) => {
              openMenu(event, chat.chatId);
            }}
          >
            <span aria-hidden>⋮</span>
          </button>
          {isMenuShown ? (
            <ChatItemMenu
              chatId={chat.chatId}
              containerRect={menuContRect}
              targetRect={menuButtonRect}
            />
          ) : null}
        </div>
      </div>
      <p className="chat-item-content">{shownMessage}</p>
    </Link>
  );
}

ChatItem.propTypes = {
  chat: PropTypes.instanceOf(ChatItemData).isRequired,
};

export default memo(ChatItem);

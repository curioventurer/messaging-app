import { useContext } from "react";
import PropTypes from "prop-types";
import { LayoutContext } from "./Layout.jsx";
import { ChatId } from "../controllers/chat-data.js";

function ChatItemMenu({ menuRef, isVisible = false, chat }) {
  const { removeChat } = useContext(LayoutContext);

  function hideChat() {
    const request = new Request(`/api/chat/${chat.id}/hide`, { method: "PUT" });

    fetch(request)
      .then((res) => res.json())
      .then((data) => {
        const chatId = new ChatId({
          id: chat.id,
          isGroup: chat.isGroup,
        });
        if (data) removeChat(chatId);
      })
      .catch(() => {});
  }

  return (
    <ul
      ref={menuRef}
      className={"chat-item-menu" + (isVisible ? "" : " hidden")}
    >
      {!chat.isGroup ? (
        <li>
          <button onClick={hideChat}>hide chat</button>
        </li>
      ) : null}
      <li>
        <button>test</button>
      </li>
    </ul>
  );
}

ChatItemMenu.propTypes = {
  menuRef: PropTypes.object.isRequired,
  isVisible: PropTypes.bool.isRequired,
  chat: PropTypes.object.isRequired,
};

export default ChatItemMenu;

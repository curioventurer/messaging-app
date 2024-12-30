import { useState, useEffect, useRef, useCallback, useContext } from "react";
import PropTypes from "prop-types";
import { LayoutContext } from "./Layout.jsx";
import { ChatId } from "../controllers/chat-data.js";

function ChatItemMenu({ target, layoutRect }) {
  const { removeChat } = useContext(LayoutContext);
  const [isBottomEdge, setIsBottomEdge] = useState(false);
  const menuRef = useRef(null);

  const chat = new ChatId(JSON.parse(target.dataset.chat));

  const updatePosition = useCallback(
    function () {
      const targetRect = target.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const MENU_MARGIN = 5;

      let isBottomEdge = false;
      let top = targetRect.top;
      let left = targetRect.right;
      const yBoundary = layoutRect.bottom - MENU_MARGIN;
      const xBoundary = layoutRect.right - MENU_MARGIN;

      if (top + menuRect.height > yBoundary) {
        isBottomEdge = true;
        top = Math.min(targetRect.bottom, yBoundary) - menuRect.height;
      }
      if (left + menuRect.width > xBoundary)
        left = Math.min(targetRect.left, xBoundary) - menuRect.width;

      menuRef.current.style.top = top - layoutRect.top + "px";
      menuRef.current.style.left = left - layoutRect.left + "px";

      setIsBottomEdge(isBottomEdge);
    },
    [target, layoutRect],
  );

  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  //update position on font-size setting change, tracked by menu resize observer.
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });
    resizeObserver.observe(menuRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updatePosition]);

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
      className={"chat-item-menu" + (isBottomEdge ? " bottom-edge" : "")}
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
  target: PropTypes.instanceOf(HTMLButtonElement).isRequired,
  layoutRect: PropTypes.instanceOf(DOMRect).isRequired,
};

export default ChatItemMenu;

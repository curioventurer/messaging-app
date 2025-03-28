import { useState, useEffect, useRef, useContext } from "react";
import PropTypes from "prop-types";
import { MenuContext, OutletContext } from "../layout/PrivateInterface.jsx";
import { socket } from "../../controllers/socket.js";
import { ChatItemData } from "../../../js/chat-data.js";

function ChatItemMenu({ chat, containerRect, targetRect }) {
  const { closeMenu } = useContext(MenuContext);
  const outletRect = useContext(OutletContext);

  const [menuRect, setMenuRect] = useState(new DOMRect());
  const [isBottomEdge, setIsBottomEdge] = useState(false);

  const menuRef = useRef(null);

  //Update menu position
  useEffect(() => {
    //if target button no longer visible due to scrolling, close menu
    if (
      targetRect.top > outletRect.bottom ||
      targetRect.bottom < outletRect.top
    )
      return closeMenu();

    const MENU_MARGIN = 5;

    const right = targetRect.left;
    const yMin = outletRect.top + MENU_MARGIN;
    const yMax = outletRect.bottom - MENU_MARGIN;

    let isBottomEdge;
    let bottom;

    if (targetRect.top + menuRect.height > yMax) {
      isBottomEdge = true;
      bottom = Math.min(targetRect.bottom, yMax);
    } else {
      isBottomEdge = false;
      bottom = Math.max(targetRect.top, yMin) + menuRect.height;
    }

    menuRef.current.style.bottom = containerRect.bottom - bottom + "px";
    menuRef.current.style.right = containerRect.right - right + "px";
    setIsBottomEdge(isBottomEdge);
  }, [containerRect, targetRect, outletRect, menuRect, closeMenu]);

  //Only run on mount, display menu after some delay to allow completion of positioning calculations before display.
  useEffect(() => {
    const DELAY = 0;

    const timeout = setTimeout(() => {
      menuRef.current.style.visibility = "visible";
    }, DELAY);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    updateMenuRect();
  }, []);

  //update menuRect on font-size setting change, tracked by menu resize observer.
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateMenuRect();
    });
    resizeObserver.observe(menuRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  function updateMenuRect() {
    /*if set directly, resizeObserver will cause errors on dismount.
      On dismount, the ref becomes null, followed by the observer triggering, but before the observer is disconnected. Error is thrown on accessing property of null.
      This prevents it.
    */
    setMenuRect(() => menuRef.current.getBoundingClientRect());
  }

  function hideChat() {
    socket.emit("hideChat", { direct_id: chat.chatId.id });
  }

  //Prevent default behavior and propagation of click beyond the menu.
  function captureClick(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <ul
      ref={menuRef}
      className={"chat-item-menu" + (isBottomEdge ? " bottom-edge" : "")}
      onClick={captureClick}
    >
      {!chat.chatId.isGroup ? (
        <li>
          <button
            className="clear-background hover-whitening"
            onClick={hideChat}
          >
            hide chat
          </button>
        </li>
      ) : null}
      <li>
        <button
          className="clear-background hover-whitening"
          onClick={closeMenu}
        >
          cancel
        </button>
      </li>
    </ul>
  );
}

ChatItemMenu.propTypes = {
  chat: PropTypes.instanceOf(ChatItemData).isRequired,
  containerRect: PropTypes.instanceOf(DOMRect).isRequired,
  targetRect: PropTypes.instanceOf(DOMRect).isRequired,
};

export default ChatItemMenu;

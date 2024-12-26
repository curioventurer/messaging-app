import { useEffect, useState, useRef, createContext } from "react";
import { Outlet } from "react-router-dom";
import Nav from "./Nav";
import ChatItemMenu from "./ChatItemMenu";
import {
  ChatItemData,
  ChatId,
  Message,
  NewMessage,
} from "../controllers/chat-data.js";

const LAYOUT_CONTEXT_DEFAULT = {
  removeChat: function () {},
  openMenu: function () {},
};

const CHAT_CONTEXT_DEFAULT = {
  chats: [new ChatItemData({})],
};

export const LayoutContext = createContext(LAYOUT_CONTEXT_DEFAULT);
export const ChatContext = createContext(CHAT_CONTEXT_DEFAULT);

function Layout() {
  const [chats, setChats] = useState(CHAT_CONTEXT_DEFAULT.chats);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuChatData, setMenuChatData] = useState(new ChatId({}));

  const chatItemButton = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const request = new Request("/api/chats", { signal: controller.signal });

    fetch(request)
      .then((res) => res.json())
      .then((data) => {
        data = data.map((item) => new ChatItemData(item));
        setChats(ChatItemData.sortChats(data));
      })
      .catch(() => {});

    return () => {
      controller.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, []);

  useEffect(() => {
    window.socket.on("message", updateLastMsg);

    return () => {
      window.socket.off("message", updateLastMsg);
    };
  }, []);

  function updateLastMsg(messageData = new NewMessage({})) {
    const newMessage = new NewMessage({
      chatId: new ChatId(messageData.chatId),
      message: new Message(messageData.message),
    });

    setChats((prevChats) => {
      const index = prevChats.findIndex(
        (chat) =>
          chat.chatId.id === newMessage.chatId.id &&
          chat.chatId.isGroup === newMessage.chatId.isGroup,
      );
      if (index === -1) return prevChats;

      const updatedChat = new ChatItemData({
        ...prevChats[index].toJSON(),
        lastMessage: newMessage.message,
      });
      const newChats = ChatItemData.sortChats([
        updatedChat,
        ...prevChats.slice(0, index),
        ...prevChats.slice(index + 1),
      ]);

      return newChats;
    });
  }

  function removeChat(chatId = new ChatId({})) {
    setChats((prevChats) => {
      const index = prevChats.findIndex(
        (chat) =>
          chat.chatId.id === chatId.id &&
          chat.chatId.isGroup === chatId.isGroup,
      );
      if (index === -1) return prevChats;

      const newChats = [
        ...prevChats.slice(0, index),
        ...prevChats.slice(index + 1),
      ];

      return newChats;
    });
  }

  function openMenu(event) {
    event.preventDefault();
    event.stopPropagation();

    //close menu instead if the same button is clicked for an already visible menu
    if (chatItemButton.current === event.target && isMenuVisible)
      return setIsMenuVisible(false);

    setIsMenuVisible(true);
    setMenuChatData(new ChatId(JSON.parse(event.target.dataset.chat)));
    chatItemButton.current = event.target;

    const targetRect = event.target.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    let top = targetRect.top;
    let left = targetRect.right;

    if (top + menuRect.height + 20 > window.innerHeight)
      top = targetRect.bottom - menuRect.height;
    if (left + menuRect.width + 20 > window.innerWidth)
      left = targetRect.left - menuRect.width;

    menuRef.current.style.top = top + "px";
    menuRef.current.style.left = left + "px";
  }

  function closeMenu() {
    setIsMenuVisible(false);
  }

  return (
    <div className="layout" onClick={closeMenu}>
      <Nav />
      <LayoutContext.Provider
        value={{
          removeChat,
          openMenu,
        }}
      >
        <ChatContext.Provider value={{ chats }}>
          <Outlet />
        </ChatContext.Provider>
        <ChatItemMenu
          menuRef={menuRef}
          isVisible={isMenuVisible}
          chat={menuChatData}
        />
      </LayoutContext.Provider>
    </div>
  );
}

export default Layout;

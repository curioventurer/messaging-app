import { useState, useEffect, useRef, createContext } from "react";
import { Outlet } from "react-router-dom";
import Nav from "./Nav";
import {
  ChatItemData,
  ChatId,
  Message,
  NewMessage,
} from "../controllers/chat-data.js";

const LAYOUT_CONTEXT_DEFAULT = {
  isMenuVisible: false,
  menuChatId: new ChatId({}),
  outletRect: new DOMRect(),
  removeChat: function () {},
  openMenu: function () {},
};

//chats: contain instances of ChatItemData - chat-data.js
const CHAT_CONTEXT_DEFAULT = {
  chats: [],
};

export const LayoutContext = createContext(LAYOUT_CONTEXT_DEFAULT);
export const ChatContext = createContext(CHAT_CONTEXT_DEFAULT);

function Layout() {
  const [chats, setChats] = useState(CHAT_CONTEXT_DEFAULT.chats);
  const [isMenuVisible, setIsMenuVisible] = useState(
    LAYOUT_CONTEXT_DEFAULT.isMenuVisible,
  );
  const [menuChatId, setMenuChatId] = useState(
    LAYOUT_CONTEXT_DEFAULT.menuChatId,
  );
  const [outletRect, setOutletRect] = useState(
    LAYOUT_CONTEXT_DEFAULT.outletRect,
  );

  const outletRef = useRef(null);

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
    window.socket.on("chat item", addChat);
    window.socket.on("unfriend", removeChat);
    window.socket.on("message", updateLastMsg);

    return () => {
      window.socket.off("chat item", addChat);
      window.socket.off("unfriend", removeChat);
      window.socket.off("message", updateLastMsg);
    };
  }, []);

  useEffect(() => {
    updateOutletRect();
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateOutletRect);

    return () => {
      window.removeEventListener("resize", updateOutletRect);
    };
  }, []);

  function addChat(chatItemData = new ChatItemData({})) {
    const chatItem = new ChatItemData(chatItemData);

    setChats((prevChats) => {
      const index = prevChats.findIndex((chat) =>
        chatItem.chatId.isEqual(chat.chatId),
      );
      if (index !== -1) return prevChats;

      const newChats = ChatItemData.sortChats([chatItem, ...prevChats]);

      return newChats;
    });
  }

  //accepts either ChatId instance or { user_id } as identifier
  function removeChat(identifier) {
    let find = () => false;

    if (identifier instanceof ChatId)
      find = (chat) => identifier.isEqual(chat.chatId);
    else find = (chat) => chat.user_id === identifier.user_id;

    setChats((prevChats) => {
      const index = prevChats.findIndex(find);
      if (index === -1) return prevChats;

      const newChats = [
        ...prevChats.slice(0, index),
        ...prevChats.slice(index + 1),
      ];

      return newChats;
    });
  }

  function updateLastMsg(messageData = new NewMessage({})) {
    const newMessage = new NewMessage({
      chatId: new ChatId(messageData.chatId),
      message: new Message(messageData.message),
    });

    setChats((prevChats) => {
      const index = prevChats.findIndex((chat) =>
        newMessage.chatId.isEqual(chat.chatId),
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

  function updateOutletRect() {
    setOutletRect(outletRef.current.getBoundingClientRect());
  }

  function openMenu(event, chatId = new ChatId({})) {
    event.preventDefault();
    event.stopPropagation();

    //close menu instead if the same button is clicked for an already visible menu
    if (isMenuVisible && menuChatId.isEqual(chatId)) return closeMenu();

    setMenuChatId(chatId);
    setIsMenuVisible(true);
  }

  function closeMenu() {
    setIsMenuVisible(false);
  }

  function handleKey(event) {
    if (event.key === "Escape") closeMenu();
  }

  return (
    <div className="layout" onClick={closeMenu} onKeyDown={handleKey}>
      <Nav />
      <LayoutContext.Provider
        value={{
          isMenuVisible,
          menuChatId,
          outletRect,
          removeChat,
          openMenu,
        }}
      >
        <ChatContext.Provider value={{ chats }}>
          <div ref={outletRef} className="outlet">
            <Outlet />
          </div>
        </ChatContext.Provider>
      </LayoutContext.Provider>
    </div>
  );
}

export default Layout;

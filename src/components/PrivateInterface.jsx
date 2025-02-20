import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
} from "react";
import { Outlet, useLoaderData } from "react-router-dom";
import Nav from "./Nav.jsx";
import {
  User,
  ChatItemData,
  ChatId,
  Message,
  NewMessage,
} from "../../controllers/chat-data.js";
import updateRect from "../../controllers/updateRect.js";

const INTERFACE_CONTEXT_DEFAULT = new User({});

const MENU_CONTEXT_DEFAULT = {
  isMenuVisible: false,
  menuChatId: new ChatId({}),
  removeChat: function () {},
  openMenu: function () {},
  closeMenu: function () {},
};

const OUTLET_CONTEXT_DEFAULT = new DOMRect();

//contain instances of ChatItemData - chat-data.js
const CHAT_LIST_CONTEXT_DEFAULT = [];

export const InterfaceContext = createContext(INTERFACE_CONTEXT_DEFAULT);
export const MenuContext = createContext(MENU_CONTEXT_DEFAULT);
export const OutletContext = createContext(OUTLET_CONTEXT_DEFAULT);
export const ChatListContext = createContext(CHAT_LIST_CONTEXT_DEFAULT);

function PrivateInterface() {
  const client = useLoaderData();

  const [chats, setChats] = useState(CHAT_LIST_CONTEXT_DEFAULT);
  const [isMenuVisible, setIsMenuVisible] = useState(
    MENU_CONTEXT_DEFAULT.isMenuVisible,
  );
  const [menuChatId, setMenuChatId] = useState(MENU_CONTEXT_DEFAULT.menuChatId);
  const [outletRect, setOutletRect] = useState(OUTLET_CONTEXT_DEFAULT);

  const outletRef = useRef(null);

  //accepts either ChatId instance or { user_id } as identifier
  const removeChat = useCallback(function (identifier) {
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
  }, []);

  const closeMenu = useCallback(function () {
    setIsMenuVisible(false);
  }, []);

  const openMenu = useCallback(
    function (event, chatId = new ChatId({})) {
      event.preventDefault();
      event.stopPropagation();

      //close menu instead if the same button is clicked for an already visible menu
      if (isMenuVisible && menuChatId.isEqual(chatId)) return closeMenu();

      setMenuChatId(chatId);
      setIsMenuVisible(true);
    },
    [isMenuVisible, menuChatId, closeMenu],
  );

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
  }, [removeChat]);

  //update rect at intervals
  useEffect(() => {
    const DELAY = 250;

    function updateAllRect() {
      updateRect(setOutletRect, outletRef.current);
    }
    updateAllRect();

    const interval = setInterval(updateAllRect, DELAY);

    return () => {
      clearInterval(interval);
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

  function handleKey(event) {
    if (event.key === "Escape") closeMenu();
  }

  return (
    <div className="interface" onClick={closeMenu} onKeyDown={handleKey}>
      <InterfaceContext.Provider value={client}>
        <Nav />
        <MenuContext.Provider
          value={useMemo(
            () => ({
              isMenuVisible,
              menuChatId,
              removeChat,
              openMenu,
              closeMenu,
            }),
            [isMenuVisible, menuChatId, removeChat, openMenu, closeMenu],
          )}
        >
          <OutletContext.Provider value={outletRect}>
            <ChatListContext.Provider value={chats}>
              <div ref={outletRef} className="outlet">
                <Outlet />
              </div>
            </ChatListContext.Provider>
          </OutletContext.Provider>
        </MenuContext.Provider>
      </InterfaceContext.Provider>
    </div>
  );
}

export default PrivateInterface;

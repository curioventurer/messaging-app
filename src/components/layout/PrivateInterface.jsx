import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
} from "react";
import { Outlet, useLoaderData } from "react-router-dom";
import useFetchedState from "../../hooks/useFetchedState.jsx";
import Nav from "./Nav.jsx";
import updateRect from "../../controllers/updateRect.js";
import sortFriendships from "../../controllers/sortFriendships.js";
import {
  UserFriendship,
  User,
  Group,
  Member,
  ChatItemData,
  ChatId,
  Message,
  NewMessage,
} from "../../../js/chat-data.js";

/*groupList: Array containing instances of Group - chat-data.js
  friendships: Array containing instances of UserFriendship - chat-data.js
  Initialized with undefined to indicate data not yet fetched.
*/
const INTERFACE_CONTEXT_DEFAULT = {
  client: new User({}),
  groupList: undefined,
  friendships: undefined,
  setFriendships: () => {},
  setGroupList: () => {},
};

const MENU_CONTEXT_DEFAULT = {
  isMenuVisible: false,
  menuChatId: new ChatId({}),
  removeChat: function () {},
  openMenu: function () {},
  closeMenu: function () {},
};

const OUTLET_CONTEXT_DEFAULT = new DOMRect();

/*Array containing instances of ChatItemData - chat-data.js
  Initialized with undefined to indicate data not yet fetched.
*/
const CHAT_LIST_CONTEXT_DEFAULT = undefined;

export const InterfaceContext = createContext(INTERFACE_CONTEXT_DEFAULT);
export const MenuContext = createContext(MENU_CONTEXT_DEFAULT);
export const OutletContext = createContext(OUTLET_CONTEXT_DEFAULT);
export const ChatListContext = createContext(CHAT_LIST_CONTEXT_DEFAULT);

function PrivateInterface() {
  const search = window.location.search;
  const client = useLoaderData();

  const parseGroupList = useCallback(function (array, setGroupList) {
    if (array === false) return setGroupList(false);

    const objectArray = array.map((item) => new Group(item));
    setGroupList(objectArray);
  }, []);
  const [groupList, setGroupList] = useFetchedState({
    callback: parseGroupList,
    path: "/api/membership-list",
  });

  const parseFriendships = useCallback(function (array, setFriendships) {
    if (array === false) return setFriendships(false);

    const objectArray = array.map((item) => new UserFriendship(item));
    setFriendships(sortFriendships(objectArray));
  }, []);
  const [friendships, setFriendships] = useFetchedState({
    callback: parseFriendships,
    path: "/api/friendship-list",
  });

  const parseChats = useCallback(function (array, setChats) {
    if (array === false) return setChats(false);

    const objectArray = array.map((item) => new ChatItemData(item));
    setChats(ChatItemData.sortChats(objectArray));
  }, []);
  const [chats, setChats] = useFetchedState({
    callback: parseChats,
    path: "/api/chat-list",
  });

  const [isMenuVisible, setIsMenuVisible] = useState(
    MENU_CONTEXT_DEFAULT.isMenuVisible,
  );
  const [menuChatId, setMenuChatId] = useState(MENU_CONTEXT_DEFAULT.menuChatId);
  const [outletRect, setOutletRect] = useState(OUTLET_CONTEXT_DEFAULT);

  const outletRef = useRef(null);

  const updateGroup = useCallback(
    function (groupData = new Group({})) {
      const newGroup = new Group(groupData);

      //Not an update for user, return.
      if (newGroup.membership.user_id !== client.id) return;

      setGroupList((prevGroupList) => {
        if (!prevGroupList) return prevGroupList;

        const index = prevGroupList.findIndex(
          (group) => group.id === newGroup.id,
        );

        let newGroupList;
        if (index === -1) newGroupList = [...prevGroupList, newGroup];
        else
          newGroupList = [
            ...prevGroupList.slice(0, index),
            newGroup,
            ...prevGroupList.slice(index + 1),
          ];

        return newGroupList;
      });
    },
    [client.id, setGroupList],
  );

  const deleteGroup = useCallback(
    function (membershipData = new Member({})) {
      const membership = new Member(membershipData);

      //Not an update for user, return.
      if (membership.user_id !== client.id) return;

      setGroupList((prevGroupList) => {
        if (!prevGroupList) return prevGroupList;

        const index = prevGroupList.findIndex(
          (group) => group.id === membership.group_id,
        );
        if (index === -1) return prevGroupList;

        //remove index.
        const newGroupList = [
          ...prevGroupList.slice(0, index),
          ...prevGroupList.slice(index + 1),
        ];

        return newGroupList;
      });
    },
    [client.id, setGroupList],
  );

  const addChat = useCallback(
    function (chatItemData = new ChatItemData({})) {
      const chatItem = new ChatItemData(chatItemData);

      setChats((prevChats) => {
        if (!prevChats) return prevChats;

        const index = prevChats.findIndex((chat) =>
          chatItem.chatId.isEqual(chat.chatId),
        );
        if (index !== -1) return prevChats;

        const newChats = ChatItemData.sortChats([chatItem, ...prevChats]);

        return newChats;
      });
    },
    [setChats],
  );

  const updateLastMsg = useCallback(
    function (messageData = new NewMessage({})) {
      const newMessage = new NewMessage({
        chatId: new ChatId(messageData.chatId),
        message: new Message(messageData.message),
      });

      setChats((prevChats) => {
        if (!prevChats) return prevChats;

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
    },
    [setChats],
  );

  //accepts either ChatId instance or { user_id } as identifier
  const removeChat = useCallback(
    function (identifier) {
      let find = () => false;

      if (identifier instanceof ChatId)
        find = (chat) => identifier.isEqual(chat.chatId);
      else find = (chat) => chat.user_id === identifier.user_id;

      setChats((prevChats) => {
        if (!prevChats) return prevChats;

        const index = prevChats.findIndex(find);
        if (index === -1) return prevChats;

        const newChats = [
          ...prevChats.slice(0, index),
          ...prevChats.slice(index + 1),
        ];

        return newChats;
      });
    },
    [setChats],
  );

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
    window.socket.on("chat item", addChat);
    window.socket.on("unfriend", removeChat);
    window.socket.on("message", updateLastMsg);
    window.socket.on("updateMembership", updateGroup);
    window.socket.on("deleteMembership", deleteGroup);

    return () => {
      window.socket.off("chat item", addChat);
      window.socket.off("unfriend", removeChat);
      window.socket.off("message", updateLastMsg);
      window.socket.off("updateMembership", updateGroup);
      window.socket.off("deleteMembership", deleteGroup);
    };

    /*Socket.IO bug: Reestablish the socket listeners on url search change.
      For reasons I do not understand, the listener disappears when changing url query.
      It is inconsistent, message listener continues to work in spite of it, but updateMembership listener fails.
    */
  }, [search, addChat, removeChat, updateLastMsg, updateGroup, deleteGroup]);

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

  function handleKey(event) {
    if (event.key === "Escape") closeMenu();
  }

  return (
    <div className="interface" onClick={closeMenu} onKeyDown={handleKey}>
      <InterfaceContext.Provider
        value={useMemo(
          () => ({
            client,
            groupList,
            friendships,
            setFriendships,
            setGroupList,
          }),
          [client, groupList, friendships, setFriendships, setGroupList],
        )}
      >
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

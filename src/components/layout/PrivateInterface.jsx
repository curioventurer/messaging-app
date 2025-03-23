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
import { socket } from "../../controllers/socket.js";
import updateRect from "../../controllers/updateRect.js";
import sortFriendships from "../../controllers/sortFriendships.js";
import {
  UserFriendship,
  UserActivity,
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
  addGroup: () => {},
};

const MENU_CONTEXT_DEFAULT = {
  isMenuVisible: false,
  menuChatId: new ChatId({}),
  hideChat: function () {},
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

  const addGroup = useCallback(
    function (groupData = new Group({})) {
      const newGroup = new Group(groupData);

      setGroupList((prevGroupList) => {
        if (!prevGroupList) return prevGroupList;

        const index = prevGroupList.findIndex(
          (group) => group.id === newGroup.id,
        );
        if (index !== -1) return;

        const newGroupList = [...prevGroupList, newGroup];
        return newGroupList;
      });
    },
    [setGroupList],
  );

  const updateMembership = useCallback(
    function (membershipData = new Member({})) {
      const newMembership = new Member(membershipData);

      setGroupList((prevGroupList) => {
        if (!prevGroupList) return prevGroupList;

        const index = prevGroupList.findIndex(
          (group) => group.id === newMembership.group_id,
        );
        if (index === -1) return prevGroupList;

        const newGroup = new Group({
          ...prevGroupList[index].toJSON(),
          membership: newMembership,
        });

        const newGroupList = [
          ...prevGroupList.slice(0, index),
          newGroup,
          ...prevGroupList.slice(index + 1),
        ];

        return newGroupList;
      });
    },
    [setGroupList],
  );

  const deleteGroup = useCallback(
    function ({ group_id }) {
      setGroupList((prevGroupList) => {
        if (!prevGroupList) return prevGroupList;

        const index = prevGroupList.findIndex((group) => group.id === group_id);
        if (index === -1) return prevGroupList;

        //remove index.
        const newGroupList = [
          ...prevGroupList.slice(0, index),
          ...prevGroupList.slice(index + 1),
        ];

        return newGroupList;
      });
    },
    [setGroupList],
  );

  //Add or replace friendship entry.
  const updateFriendship = useCallback(
    function (friendshipData = new UserFriendship({})) {
      const friendship = new UserFriendship(friendshipData);

      setFriendships((prevFriendships) => {
        if (!prevFriendships) return prevFriendships;

        const index = prevFriendships.findIndex(
          (friend) => friend.id === friendship.id,
        );

        let newFriendships;
        //add
        if (index === -1) newFriendships = [friendship, ...prevFriendships];
        //replace
        else
          newFriendships = [
            ...prevFriendships.slice(0, index),
            friendship,
            ...prevFriendships.slice(index + 1),
          ];

        return sortFriendships(newFriendships);
      });
    },
    [setFriendships],
  );

  const updateFriendStatus = useCallback(
    function (statusData = new UserActivity({})) {
      const status = new UserActivity(statusData);

      setFriendships((prevFriendships) => {
        if (!prevFriendships) return prevFriendships;

        const index = prevFriendships.findIndex(
          (friend) => friend.user_id === status.user_id,
        );
        if (index === -1) return prevFriendships;

        const friendship = new UserFriendship({
          ...prevFriendships[index],
          activity: status.activity,
        });

        //if offline, store last_seen value.
        if (status.activity === User.ACTIVITY.OFFLINE)
          friendship.last_seen = status.last_seen;

        const newFriendships = sortFriendships([
          ...prevFriendships.slice(0, index),
          friendship,
          ...prevFriendships.slice(index + 1),
        ]);
        return newFriendships;
      });
    },
    [setFriendships],
  );

  const deleteFriendship = useCallback(
    function ({ user_id }) {
      setFriendships((prevFriendships) => {
        if (!prevFriendships) return prevFriendships;

        const index = prevFriendships.findIndex(
          (friend) => friend.user_id === user_id,
        );
        if (index === -1) return prevFriendships;

        const newFriendships = [
          ...prevFriendships.slice(0, index),
          ...prevFriendships.slice(index + 1),
        ];
        return newFriendships;
      });
    },
    [setFriendships],
  );

  const updateDirectId = useCallback(
    function ({ user_id, direct_chat_id }) {
      setFriendships((prevFriendships) => {
        if (!prevFriendships) return prevFriendships;

        const index = prevFriendships.findIndex(
          (friend) => friend.user_id === user_id,
        );
        if (index === -1) return prevFriendships;

        const friendship = new UserFriendship({
          ...prevFriendships[index],
          direct_chat_id,
        });

        const newFriendships = [
          ...prevFriendships.slice(0, index),
          friendship,
          ...prevFriendships.slice(index + 1),
        ];
        return newFriendships;
      });
    },
    [setFriendships],
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

  const deleteUserMessage = useCallback(
    function ({ group_id, user_id }) {
      const chatId = new ChatId({ id: group_id, isGroup: true });

      setChats((prevChats) => {
        if (!prevChats) return prevChats;

        const index = prevChats.findIndex(
          (chat) =>
            chat.chatId.isEqual(chatId) && chat.lastMessage.user_id === user_id,
        );
        if (index === -1) return prevChats;

        const newMessage = new Message({
          ...prevChats[index].lastMessage,
          text: "",
          is_deleted: true,
        });

        const updatedChat = new ChatItemData({
          ...prevChats[index].toJSON(),
          lastMessage: newMessage,
        });

        const newChats = ChatItemData.sortChats([
          ...prevChats.slice(0, index),
          updatedChat,
          ...prevChats.slice(index + 1),
        ]);

        return newChats;
      });
    },
    [setChats],
  );

  const deleteChat = useCallback(
    function (find = () => {}) {
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

  const deleteDirectChat = useCallback(
    function ({ user_id }) {
      const find = (chat) => chat.user_id === user_id;
      deleteChat(find);
    },
    [deleteChat],
  );

  const deleteGroupChat = useCallback(
    function ({ group_id }) {
      const chatId = new ChatId({
        id: group_id,
        isGroup: true,
      });

      const find = (chat) => chat.chatId.isEqual(chatId);
      deleteChat(find);
    },
    [deleteChat],
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

  const hideChat = useCallback(
    function (user_id) {
      deleteDirectChat({ user_id });

      //clear direct id by setting to default of 0.
      updateDirectId({ user_id, direct_chat_id: 0 });
    },
    [deleteDirectChat, updateDirectId],
  );

  useEffect(() => {
    socket.on("chat item", addChat);
    socket.on("message", updateLastMsg);
    socket.on("deleteUserMessages", deleteUserMessage);

    socket.on("update friendship", updateFriendship);
    socket.on("updateDirectId", updateDirectId);
    socket.on("friend", updateFriendStatus);
    socket.on("deleteFriendship", deleteFriendship);
    socket.on("deleteFriendship", deleteDirectChat);

    socket.on("addMembership", addGroup);
    socket.on("updateMembership", updateMembership);
    socket.on("deleteMembership", deleteGroup);
    socket.on("deleteMembership", deleteGroupChat);

    return () => {
      socket.off("chat item", addChat);
      socket.off("message", updateLastMsg);
      socket.off("deleteUserMessages", deleteUserMessage);

      socket.off("update friendship", updateFriendship);
      socket.off("updateDirectId", updateDirectId);
      socket.off("friend", updateFriendStatus);
      socket.off("deleteFriendship", deleteFriendship);
      socket.off("deleteFriendship", deleteDirectChat);

      socket.off("addMembership", addGroup);
      socket.off("updateMembership", updateMembership);
      socket.off("deleteMembership", deleteGroup);
      socket.off("deleteMembership", deleteGroupChat);
    };
  }, [
    addChat,
    updateLastMsg,
    deleteUserMessage,

    updateFriendship,
    updateDirectId,
    updateFriendStatus,
    deleteFriendship,
    deleteDirectChat,

    addGroup,
    updateMembership,
    deleteGroup,
    deleteGroupChat,
  ]);

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
            addGroup,
          }),
          [client, groupList, friendships, addGroup],
        )}
      >
        <Nav />
        <MenuContext.Provider
          value={useMemo(
            () => ({
              isMenuVisible,
              menuChatId,
              hideChat,
              openMenu,
              closeMenu,
            }),
            [isMenuVisible, menuChatId, hideChat, openMenu, closeMenu],
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

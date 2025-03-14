import {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useMemo,
  createContext,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import useTitle from "../../hooks/useTitle.jsx";
import useSearchState from "../../hooks/useSearchState.jsx";
import useFetchedState from "../../hooks/useFetchedState.jsx";
import ChatList from "../chatlist/ChatList.jsx";
import RoomInfo from "./RoomInfo.jsx";
import RoomUI from "./RoomUI.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import clearSocket from "../../controllers/clearSocket.js";
import { boolType, searchType } from "../../controllers/constant.js";
import {
  DEFAULT_TEXT,
  User,
  ChatId,
  Message,
  NewMessage,
  Group,
  Direct,
  Member,
} from "../../../js/chat-data.js";

/*room: Instance of Group or Direct - chat-data.js
  member: Array containing instances of Member - chat-data.js
  Initialized with undefined to indicate data not yet fetched.
*/
const ROOM_CONTEXT_DEFAULT = {
  client: new User({}),
  chatId: new ChatId({}),
  room: undefined,
  members: undefined,
  appendMessage: function () {},
  deleteSentMsg: function () {},
  updateRoomInfoIsShown: function () {},
  updateRoomInfoIsExpanded: function () {},
  storeRoomHeaderRef: function () {},
};

/*Array containing instances of Message - chat-data.js
  Initialized with undefined to indicate data not yet fetched.
*/
const MESSAGE_LIST_CONTEXT_DEFAULT = undefined;

export const RoomContext = createContext(ROOM_CONTEXT_DEFAULT);
export const MessageListContext = createContext(MESSAGE_LIST_CONTEXT_DEFAULT);

function Room({ isGroup = true, title = false }) {
  const { chat_id } = useParams();
  const { client } = useContext(InterfaceContext);

  const [room, setRoom] = useState(ROOM_CONTEXT_DEFAULT.room);
  const [members, setMembers] = useState(ROOM_CONTEXT_DEFAULT.members);
  const [messages, setMessages] = useState(MESSAGE_LIST_CONTEXT_DEFAULT);

  const [roomInfoIsShown, setRoomInfoIsShown] = useSearchState({
    param: "info",
    type: searchType.BOOL,
  });
  const [roomInfoIsExpanded, setRoomInfoIsExpanded] = useSearchState({
    param: "expand-info",
    type: searchType.BOOL,
  });

  const roomHeaderRef = useRef(null);
  const navigate = useNavigate();

  const chatId = useMemo(
    () =>
      new ChatId({
        id: Number(chat_id),
        isGroup,
      }),
    [chat_id, isGroup],
  );
  const apiPath = (chatId.isGroup ? "/api/group/" : "/api/chat/") + chatId.id;

  const clearRoomData = useCallback(function (value = undefined) {
    setRoom(value);
    setMembers(value);
    setMessages(value);
  }, []);

  const parseRoomData = useCallback(
    function (data) {
      if (data === false) return clearRoomData(false);

      setRoom(chatId.isGroup ? new Group(data.room) : new Direct(data.room));
      setMembers(
        chatId.isGroup ? data.members.map((member) => new Member(member)) : [],
      );
      setMessages(data.messages.map((msg) => new Message(msg)));
    },
    [chatId, clearRoomData],
  );

  const appendMessage = useCallback(function (message = new Message({})) {
    setMessages((prevMessages) => {
      if (!prevMessages) return prevMessages;

      const newMessages = Message.sortMessages([...prevMessages, message]);
      return newMessages;
    });
  }, []);

  const deleteSentMsg = useCallback(function (clientId) {
    setMessages((prevMessages) => {
      if (!prevMessages) return prevMessages;

      const index = prevMessages.findIndex(
        (message) => message.id === clientId,
      );
      if (index === -1) return prevMessages;

      const newMessages = [
        ...prevMessages.slice(0, index),
        ...prevMessages.slice(index + 1),
      ];
      return newMessages;
    });
  }, []);

  const updateRoomInfoIsExpanded = useCallback(
    function (type = boolType.TOGGLE) {
      switch (type) {
        case boolType.FALSE:
          if (roomInfoIsExpanded) shrinkRoomInfo();
          break;
        case boolType.TRUE:
          if (!roomInfoIsExpanded) expandRoomInfo();
          break;
        case boolType.TOGGLE:
          if (roomInfoIsExpanded) shrinkRoomInfo();
          else expandRoomInfo();
          break;
      }

      function expandRoomInfo() {
        setRoomInfoIsExpanded(true);
      }

      function shrinkRoomInfo() {
        setRoomInfoIsExpanded(false);
      }
    },
    [roomInfoIsExpanded, setRoomInfoIsExpanded],
  );

  const updateRoomInfoIsShown = useCallback(
    function (type = boolType.TOGGLE) {
      switch (type) {
        case boolType.FALSE:
          if (roomInfoIsShown) closeRoomInfo();
          break;
        case boolType.TRUE:
          if (!roomInfoIsShown) openRoomInfo();
          break;
        case boolType.TOGGLE:
          if (roomInfoIsShown) closeRoomInfo();
          else openRoomInfo();
          break;
      }

      function openRoomInfo() {
        setRoomInfoIsShown(true);
      }

      function closeRoomInfo() {
        /*2 simultaneous updates of searchParams causes 1 to fail to update.
          The 2nd update needs to be delayed with timeout.

          This is a problem with react router's setSearchParams(),
          it does not operate like react's setState() that allows result from previous update to
          carry over to the next update when using callbacks.

          Delay of 0 works, but i don't know if it will work under edge conditions.
          I use a large delay instead to also create an animation like transition.
        */
        if (roomInfoIsExpanded) {
          updateRoomInfoIsExpanded(boolType.FALSE);

          setTimeout(() => {
            setRoomInfoIsShown(false);
            roomHeaderRef.current.focus();
          }, 300);
        } else {
          //only 1 update, no need for timeout.
          setRoomInfoIsShown(false);
          roomHeaderRef.current.focus();
        }
      }
    },
    [
      roomInfoIsShown,
      roomInfoIsExpanded,
      setRoomInfoIsShown,
      updateRoomInfoIsExpanded,
    ],
  );

  const storeRoomHeaderRef = useCallback(function (element) {
    roomHeaderRef.current = element;
  }, []);

  const roomName = room ? room.name : DEFAULT_TEXT;
  useTitle((chatId.isGroup ? "Group" : "Chat") + " - " + roomName, !title);

  /*Handle invalid search param.
    If room info is expanded without being shown, set expand to false.
  */
  useEffect(() => {
    if (roomInfoIsExpanded && !roomInfoIsShown) {
      setRoomInfoIsExpanded(false);
    }
  }, [roomInfoIsShown, roomInfoIsExpanded, setRoomInfoIsExpanded]);

  useEffect(() => clearSocket, [chatId]);

  useFetchedState({
    callback: parseRoomData,
    path: apiPath,
    clearState: clearRoomData,
  });

  useEffect(() => {
    function addNewMessage(messageData) {
      const newMessage = new NewMessage({
        chatId: new ChatId(messageData.chatId),
        message: new Message(messageData.message),
      });

      if (newMessage.chatId.isEqual(chatId)) appendMessage(newMessage.message);
    }

    window.socket.on("message", addNewMessage);

    return () => {
      window.socket.off("message", addNewMessage);
    };
  }, [chatId, appendMessage]);

  //if current room shows the direct chat of removed friend, redirect to home
  const directChatUserId = chatId.isGroup ? undefined : room?.user_id;
  useEffect(() => {
    function handleUnfriend({ user_id }) {
      if (directChatUserId === user_id)
        navigate("/home", {
          replace: true,
        });
    }

    window.socket.on("unfriend", handleUnfriend);

    return () => {
      window.socket.off("unfriend", handleUnfriend);
    };
  }, [navigate, directChatUserId]);

  return (
    <div className="room">
      <RoomContext.Provider
        value={useMemo(
          () => ({
            client,
            chatId,
            room,
            members,
            appendMessage,
            deleteSentMsg,
            updateRoomInfoIsShown,
            updateRoomInfoIsExpanded,
            storeRoomHeaderRef,
          }),
          [
            client,
            chatId,
            room,
            members,
            appendMessage,
            deleteSentMsg,
            updateRoomInfoIsShown,
            updateRoomInfoIsExpanded,
            storeRoomHeaderRef,
          ],
        )}
      >
        <MessageListContext.Provider value={messages}>
          <ChatList roomInfoIsShown={roomInfoIsShown} />
          <RoomInfo
            roomInfoIsShown={roomInfoIsShown}
            roomInfoIsExpanded={roomInfoIsExpanded}
          />
          <RoomUI
            roomInfoIsShown={roomInfoIsShown}
            roomInfoIsExpanded={roomInfoIsExpanded}
          />
        </MessageListContext.Provider>
      </RoomContext.Provider>
    </div>
  );
}

Room.propTypes = {
  isGroup: PropTypes.bool,
  title: PropTypes.bool,
};

export default Room;

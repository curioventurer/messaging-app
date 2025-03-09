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
import useTitle from "../../hooks/useTitle";
import useFetch from "../../hooks/useFetch";
import ChatList from "../chatlist/ChatList";
import RoomInfo from "./RoomInfo";
import RoomUI from "./RoomUI";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import clearSocket from "../../controllers/clearSocket.js";
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
  toggleRoomInfo: function () {},
  toggleExpandRoomInfo: function () {},
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
  const client = useContext(InterfaceContext);

  const [room, setRoom] = useState(ROOM_CONTEXT_DEFAULT.room);
  const [members, setMembers] = useState(ROOM_CONTEXT_DEFAULT.members);
  const [messages, setMessages] = useState(MESSAGE_LIST_CONTEXT_DEFAULT);

  const [roomInfoIsShown, setRoomInfoIsShown] = useState(false);
  const [roomInfoIsExpanded, setRoomInfoIsExpanded] = useState(false);

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

  const parseRoomData = useCallback(
    function (data) {
      if (data === false) return clearRoomData(false);

      setRoom(chatId.isGroup ? new Group(data.room) : new Direct(data.room));
      setMembers(
        chatId.isGroup ? data.members.map((member) => new Member(member)) : [],
      );
      setMessages(data.messages.map((msg) => new Message(msg)));
    },
    [chatId],
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

  const toggleRoomInfo = useCallback(function () {
    setRoomInfoIsShown((prev) => {
      //if true, and thus about to hide roomInfo, move focus back to RoomHeader
      if (prev) {
        setRoomInfoIsExpanded(false);
        roomHeaderRef.current.focus();
      }

      return !prev;
    });
  }, []);

  const toggleExpandRoomInfo = useCallback(function () {
    setRoomInfoIsExpanded((prev) => !prev);
  }, []);

  const storeRoomHeaderRef = useCallback(function (element) {
    roomHeaderRef.current = element;
  }, []);

  const roomName = room ? room.name : DEFAULT_TEXT;
  useTitle((chatId.isGroup ? "Group" : "Chat") + " - " + roomName, !title);

  useEffect(() => clearSocket, [chatId]);

  //On room change, clear room data to avoid showing previous data, also used to specify the display of loading text.
  useEffect(() => clearRoomData, [chatId]);

  const isExpired = useFetch({ callback: parseRoomData, path: apiPath });

  /*If fetch timeouts(expires), set null to indicate fetch failure.
    Else, initialize to undefined to indicate fetch in progress.
  */
  useEffect(() => {
    if (isExpired) clearRoomData(null);
    else clearRoomData(undefined);
  }, [isExpired]);

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

  function clearRoomData(value = undefined) {
    setRoom(value);
    setMembers(value);
    setMessages(value);
  }

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
            toggleRoomInfo,
            toggleExpandRoomInfo,
            storeRoomHeaderRef,
          }),
          [
            client,
            chatId,
            room,
            members,
            appendMessage,
            deleteSentMsg,
            toggleRoomInfo,
            toggleExpandRoomInfo,
            storeRoomHeaderRef,
          ],
        )}
      >
        <MessageListContext.Provider value={messages}>
          {roomInfoIsShown ? (
            <RoomInfo roomInfoIsExpanded={roomInfoIsExpanded} />
          ) : (
            <ChatList />
          )}
          {roomInfoIsExpanded ? null : (
            <RoomUI roomInfoIsShown={roomInfoIsShown} />
          )}
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

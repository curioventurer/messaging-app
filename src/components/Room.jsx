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
import useTitle from "../hooks/useTitle";
import useFetch from "../hooks/useFetch";
import ChatList from "./ChatList";
import RoomInfo from "./RoomInfo";
import RoomUI from "./RoomUI";
import { InterfaceContext } from "./PrivateInterface";
import clearSocket from "../controllers/clearSocket.js";
import {
  DEFAULT_TEXT,
  ChatId,
  ChatData,
  Message,
  NewMessage,
  Group,
  Direct,
  Member,
} from "../../js/chat-data.js";

const ROOM_CONTEXT_DEFAULT = {
  client: {
    id: 0,
    name: "default_name",
    created: "1970-01-01T00:00:00.000Z",
  },
  chatId: new ChatId({}),
  appendMessage: function () {},
  deleteSentMsg: function () {},
  toggleRoomInfo: function () {},
  storeRoomHeaderRef: function () {},
};

/*Instance of ChatData - chat-data.js
  Initialized with undefined to indicate data not yet fetched.
*/
const CHAT_CONTEXT_DEFAULT = {
  chatData: undefined,
};

export const RoomContext = createContext(ROOM_CONTEXT_DEFAULT);
export const ChatContext = createContext(CHAT_CONTEXT_DEFAULT);

function Room({ isGroup = true, title = false }) {
  const { chat_id } = useParams();
  const client = useContext(InterfaceContext);

  const [chatData, setChatData] = useState(CHAT_CONTEXT_DEFAULT.chatData);
  const [isChatInfoShown, setIsChatInfoShown] = useState(false);

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

  const parseChatData = useCallback(
    function (data) {
      if (data === false) return setChatData(data);

      setChatData(
        new ChatData({
          isGroup: data.isGroup,
          messages: data.messages.map((msg) => new Message(msg)),
          group: new Group(data.group),
          direct: new Direct(data.direct),
          members: Member.sortMembers(
            data.members.map((member) => new Member(member)),
            client.id,
          ),
        }),
      );
    },
    [client],
  );

  const appendMessage = useCallback(function (message = new Message({})) {
    setChatData((prevChatData) => {
      if (!prevChatData) return prevChatData;

      const newMessages = Message.sortMessages([
        ...prevChatData.messages,
        message,
      ]);
      const newChatData = {
        ...prevChatData,
        messages: newMessages,
      };
      return newChatData;
    });
  }, []);

  const deleteSentMsg = useCallback(function (clientId) {
    setChatData((prevChatData) => {
      if (!prevChatData) return prevChatData;

      const prevMessages = prevChatData.messages;
      const index = prevMessages.findIndex(
        (message) => message.id === clientId,
      );
      if (index === -1) return prevChatData;

      const newMessages = [
        ...prevMessages.slice(0, index),
        ...prevMessages.slice(index + 1),
      ];

      const newChatData = {
        ...prevChatData,
        messages: newMessages,
      };
      return newChatData;
    });
  }, []);

  const toggleRoomInfo = useCallback(function () {
    setIsChatInfoShown((prev) => {
      //if true, and thus about to hide roomInfo, move focus back to RoomHeader
      if (prev) roomHeaderRef.current.focus();

      return !prev;
    });
  }, []);

  const storeRoomHeaderRef = useCallback(function (element) {
    roomHeaderRef.current = element;
  }, []);

  const roomName = chatData ? chatData.name : DEFAULT_TEXT;
  useTitle((isGroup ? "Group" : "Chat") + " - " + roomName, !title);

  useEffect(() => clearSocket, [chatId]);

  //On room change, reset chatData to default to clear display to avoid showing old data, also used to indicate the display of loading text.
  useEffect(() => resetChatData, [chatId]);

  const isExpired = useFetch({ callback: parseChatData, path: apiPath });

  /*If fetch timeouts(expires), set null to indicate fetch failure.
    Else, initialize to undefined to indicate fetch in progress.
  */
  useEffect(() => {
    if (isExpired) setChatData(null);
    else setChatData(undefined);
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
  const directChatUserId = chatData?.direct?.user_id;
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

  function resetChatData() {
    setChatData(CHAT_CONTEXT_DEFAULT.chatData);
  }

  return (
    <div className="room">
      <RoomContext.Provider
        value={useMemo(
          () => ({
            client,
            chatId,
            appendMessage,
            deleteSentMsg,
            toggleRoomInfo,
            storeRoomHeaderRef,
          }),
          [
            client,
            chatId,
            appendMessage,
            deleteSentMsg,
            toggleRoomInfo,
            storeRoomHeaderRef,
          ],
        )}
      >
        <ChatContext.Provider value={useMemo(() => ({ chatData }), [chatData])}>
          {isChatInfoShown ? <RoomInfo /> : <ChatList />}
          <RoomUI isChatInfoShown={isChatInfoShown} />
        </ChatContext.Provider>
      </RoomContext.Provider>
    </div>
  );
}

Room.propTypes = {
  isGroup: PropTypes.bool,
  title: PropTypes.bool,
};

export default Room;

import {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useMemo,
  createContext,
} from "react";
import { useParams } from "react-router-dom";
import PropTypes from "prop-types";
import useTitle from "../hooks/useTitle.jsx";
import ChatList from "./ChatList.jsx";
import RoomInfo from "./RoomInfo.jsx";
import RoomUI from "./RoomUI.jsx";
import { InterfaceContext } from "./PrivateInterface.jsx";
import clearSocket from "../../controllers/clearSocket.js";
import {
  ChatId,
  ChatData,
  Message,
  NewMessage,
  Group,
  Direct,
  Member,
} from "../../controllers/chat-data.js";

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

const CHAT_CONTEXT_DEFAULT = {
  chatData: new ChatData({}),
};

export const RoomContext = createContext(ROOM_CONTEXT_DEFAULT);
export const ChatContext = createContext(CHAT_CONTEXT_DEFAULT);

function Room({ isGroup = true, title = false }) {
  const { chat_id } = useParams();
  const chatId = useMemo(
    () =>
      new ChatId({
        id: Number(chat_id),
        isGroup: isGroup,
      }),
    [chat_id, isGroup],
  );

  const client = useContext(InterfaceContext);

  const [chatData, setChatData] = useState(CHAT_CONTEXT_DEFAULT.chatData);
  const [isChatInfoShown, setIsChatInfoShown] = useState(false);

  const roomHeaderRef = useRef(null);

  useTitle((isGroup ? "Group" : "Chat") + " - " + chatData.name, !title);

  const appendMessage = useCallback(function (message = new Message({})) {
    setChatData((prevChatData) => {
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

  useEffect(() => clearSocket, [chatId]);

  //on room change, clear display to avoid showing old data, while waiting for fetch of new data.
  useEffect(() => clearChatData, [chatId]);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request(
      (chatId.isGroup ? "/api/group/" : "/api/chat/") + chatId.id,
      {
        signal: controller.signal,
      },
    );

    fetch(request)
      .then((res) => res.json())
      .then((data) => {
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
      })
      .catch(() => {});

    return () => {
      controller.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, [chatId, client]);

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

  //if current room shows the direct chat of removed friend, clear display
  const directChatUserId = chatData.direct.user_id;
  useEffect(() => {
    function handleUnfriend({ user_id }) {
      if (directChatUserId === user_id) clearChatData();
    }

    window.socket.on("unfriend", handleUnfriend);

    return () => {
      window.socket.off("unfriend", handleUnfriend);
    };
  }, [directChatUserId]);

  function clearChatData() {
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

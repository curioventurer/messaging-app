import { useState, useEffect, useMemo, createContext } from "react";
import { useParams, useRouteLoaderData } from "react-router-dom";
import PropTypes from "prop-types";
import ChatList from "./ChatList.jsx";
import GroupInfo from "./GroupInfo.jsx";
import RoomUI from "./RoomUI.jsx";
import clearSocket from "../controllers/clearSocket.js";
import {
  ChatId,
  ChatData,
  Message,
  NewMessage,
  Group,
  Direct,
  Member,
} from "../controllers/chat-data.js";
import sortMessages from "../controllers/sortMessages.js";
import sortMembers from "../controllers/sortMembers.js";

const CHAT_CONTEXT_DEFAULT = {
  userData: {
    id: 0,
    name: "default_name",
    created: "1970-01-01T00:00:00.000Z",
  },
  chatData: new ChatData({}),
  chatId: new ChatId({}),
  appendMessage: function () {},
  deleteSentMsg: function () {},
  toggleChatInfo: function () {},
};

export const ChatContext = createContext(CHAT_CONTEXT_DEFAULT);

function Room({ isGroup = true }) {
  const { chat_id } = useParams();
  const chatId = useMemo(
    () =>
      new ChatId({
        id: Number(chat_id),
        isGroup: isGroup,
      }),
    [chat_id, isGroup],
  );

  const userData = useRouteLoaderData("layout");

  const [chatData, setChatData] = useState(CHAT_CONTEXT_DEFAULT.chatData);
  const [isChatInfoShown, setIsChatInfoShown] = useState(false);

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
            members: sortMembers(
              data.members.map((member) => new Member(member)),
              userData.id,
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
  }, [chatId, userData.id]);

  useEffect(() => {
    function addNewMessage(messageData) {
      const newMessage = new NewMessage({
        chatId: new ChatId(messageData.chatId),
        message: new Message(messageData.message),
      });

      if (
        newMessage.chatId.isGroup === chatId.isGroup &&
        newMessage.chatId.id === chatId.id
      )
        appendMessage(newMessage.message);
    }

    window.socket.on("message", addNewMessage);

    return () => {
      window.socket.off("message", addNewMessage);
    };
  }, [chatId]);

  useEffect(() => {
    //if current room shows the direct chat of removed friend, reset room to show default data
    function handleUnfriend({ user_id }) {
      if (chatData.direct.user_id === user_id) setChatData(new ChatData({}));
    }

    window.socket.on("unfriend", handleUnfriend);

    return () => {
      window.socket.off("unfriend", handleUnfriend);
    };
  }, [chatData]);

  useEffect(() => {
    return () => {
      clearSocket();
    };
  }, [chatId]);

  function appendMessage(message = new Message({})) {
    setChatData((prevChatData) => {
      const newMessages = sortMessages([...prevChatData.messages, message]);
      const newChatData = {
        ...prevChatData,
        messages: newMessages,
      };
      return newChatData;
    });
  }

  function deleteSentMsg(clientId) {
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
  }

  function toggleChatInfo() {
    setIsChatInfoShown(!isChatInfoShown);
  }

  return (
    <div className="room">
      <ChatContext.Provider
        value={{
          userData,
          chatData,
          chatId,
          appendMessage,
          deleteSentMsg,
          toggleChatInfo,
        }}
      >
        {isChatInfoShown ? <GroupInfo /> : <ChatList />}
        <RoomUI />
      </ChatContext.Provider>
    </div>
  );
}

Room.propTypes = {
  isGroup: PropTypes.bool,
};

export default Room;

import { useState, useEffect, createContext } from "react";
import { useParams, useLoaderData } from "react-router-dom";
import ChatList from "./ChatList";
import ChatInfo from "./ChatInfo";
import ChatInterface from "./ChatInterface";
import sortMessages from "../controllers/sortMessages.js";

const CHAT_CONTEXT_DEFAULT = {
  userData: {
    id: 0,
    username: "default_username",
    created: "1970-01-01T00:00:00.000Z",
  },
  chatData: {
    room: {
      id: 0,
      name: "default_name",
      created: "1970-01-01T00:00:00.000Z",
    },
    members: [],
    messages: [],
  },
  chatId: 0,
  appendMessage: function () {},
  updateSentMsg: function () {},
  toggleChatInfo: function () {},
};

export const ChatContext = createContext(CHAT_CONTEXT_DEFAULT);

function ChatRoom() {
  let { chatId } = useParams();
  chatId = Number(chatId);
  const userData = useLoaderData();

  let [chatData, setChatData] = useState(CHAT_CONTEXT_DEFAULT.chatData);
  let [isChatInfoShown, setIsChatInfoShown] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/chat/" + chatId, {
      signal: controller.signal,
    });

    fetch(request)
      .then((res) => res.json())
      .then((data) => {
        setChatData(data);
      })
      .catch(() => {});

    return () => {
      controller.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, [chatId]);

  useEffect(() => {
    function addNewMessage(message) {
      if (message.chat_room_id !== chatId) return;
      appendMessage(message);
    }

    window.socket.on("message", addNewMessage);

    return () => {
      window.socket.off("message", addNewMessage);
    };
  }, [chatId]);

  useEffect(() => {
    function clearSocketSentData() {
      window.socket.sendBuffer = [];
      window.socket._clearAcks();
    }

    return () => {
      clearSocketSentData();
    };
  }, [chatId]);

  function appendMessage(message) {
    setChatData((prevChatData) => {
      const newMessages = sortMessages([...prevChatData.messages, message]);
      const newChatData = {
        ...prevChatData,
        messages: newMessages,
      };
      return newChatData;
    });
  }

  function updateSentMsg(res) {
    setChatData((prevChatData) => {
      const prevMessages = prevChatData.messages;
      const index = prevMessages.findIndex(
        (message) => message.id === res.clientId,
      );
      if (index === -1) return prevChatData;

      const sentMessage = { ...prevMessages[index] };
      sentMessage.id = res.id;
      sentMessage.created = res.created;

      const newMessages = sortMessages([
        ...prevMessages.slice(0, index),
        sentMessage,
        ...prevMessages.slice(index + 1),
      ]);

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
    <div className="chat-room">
      <ChatContext.Provider
        value={{
          userData,
          chatData,
          chatId,
          appendMessage,
          updateSentMsg,
          toggleChatInfo,
        }}
      >
        {isChatInfoShown ? <ChatInfo /> : <ChatList />}
        <ChatInterface />
      </ChatContext.Provider>
    </div>
  );
}

export default ChatRoom;

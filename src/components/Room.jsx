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

const GROUP_CONTEXT_DEFAULT = {
  userData: {
    id: 0,
    name: "default_name",
    created: "1970-01-01T00:00:00.000Z",
  },
  groupData: new ChatData({}),
  chatId: new ChatId({}),
  appendMessage: function () {},
  deleteSentMsg: function () {},
  toggleGroupInfo: function () {},
};

export const GroupContext = createContext(GROUP_CONTEXT_DEFAULT);

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

  const [groupData, setGroupData] = useState(GROUP_CONTEXT_DEFAULT.groupData);
  const [isGroupInfoShown, setIsGroupInfoShown] = useState(false);

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
        setGroupData(
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
    return () => {
      clearSocket();
    };
  }, [chatId]);

  function appendMessage(message = new Message({})) {
    setGroupData((prevGroupData) => {
      const newMessages = sortMessages([...prevGroupData.messages, message]);
      const newGroupData = {
        ...prevGroupData,
        messages: newMessages,
      };
      return newGroupData;
    });
  }

  function deleteSentMsg(clientId) {
    setGroupData((prevGroupData) => {
      const prevMessages = prevGroupData.messages;
      const index = prevMessages.findIndex(
        (message) => message.id === clientId,
      );
      if (index === -1) return prevGroupData;

      const newMessages = [
        ...prevMessages.slice(0, index),
        ...prevMessages.slice(index + 1),
      ];

      const newGroupData = {
        ...prevGroupData,
        messages: newMessages,
      };
      return newGroupData;
    });
  }

  function toggleGroupInfo() {
    setIsGroupInfoShown(!isGroupInfoShown);
  }

  return (
    <div className="room">
      <GroupContext.Provider
        value={{
          userData,
          groupData,
          chatId,
          appendMessage,
          deleteSentMsg,
          toggleGroupInfo,
        }}
      >
        {isGroupInfoShown ? <GroupInfo /> : <ChatList />}
        <RoomUI />
      </GroupContext.Provider>
    </div>
  );
}

Room.propTypes = {
  isGroup: PropTypes.bool,
};

export default Room;

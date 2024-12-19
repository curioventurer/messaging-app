import { useState, useEffect, createContext } from "react";
import { useParams, useRouteLoaderData } from "react-router-dom";
import PropTypes from "prop-types";
import ChatList from "./ChatList.jsx";
import GroupInfo from "./GroupInfo.jsx";
import RoomUI from "./RoomUI.jsx";
import clearSocket from "../controllers/clearSocket.js";
import {
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
  isGroupChat: true,
  chat_id: 0,
  appendMessage: function () {},
  deleteSentMsg: function () {},
  toggleGroupInfo: function () {},
};

export const GroupContext = createContext(GROUP_CONTEXT_DEFAULT);

function Room({ isGroupChat = true }) {
  let { chat_id } = useParams();
  chat_id = Number(chat_id);
  const userData = useRouteLoaderData("layout");

  const [groupData, setGroupData] = useState(GROUP_CONTEXT_DEFAULT.groupData);
  const [isGroupInfoShown, setIsGroupInfoShown] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request(
      (isGroupChat ? "/api/group/" : "/api/chat/") + chat_id,
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
  }, [isGroupChat, chat_id, userData.id]);

  useEffect(() => {
    function addNewMessage(messageData) {
      const newMessage = new NewMessage({
        ...messageData,
        message: new Message(messageData.message),
      });

      if (
        newMessage.isGroupChat === isGroupChat &&
        newMessage.chat_id === chat_id
      )
        appendMessage(newMessage.message);
    }

    window.socket.on("message", addNewMessage);

    return () => {
      window.socket.off("message", addNewMessage);
    };
  }, [isGroupChat, chat_id]);

  useEffect(() => {
    return () => {
      clearSocket();
    };
  }, [isGroupChat, chat_id]);

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
          isGroupChat,
          chat_id,
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
  isGroupChat: PropTypes.bool,
};

export default Room;

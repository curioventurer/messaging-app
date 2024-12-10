import { useState, useEffect, createContext } from "react";
import { useParams, useLoaderData } from "react-router-dom";
import GroupList from "./GroupList.jsx";
import GroupInfo from "./GroupInfo.jsx";
import RoomUI from "./RoomUI.jsx";
import sortMessages from "../controllers/sortMessages.js";

const GROUP_CONTEXT_DEFAULT = {
  userData: {
    id: 0,
    name: "default_name",
    created: "1970-01-01T00:00:00.000Z",
  },
  groupData: {
    group: {
      id: 0,
      name: "default_name",
      created: "1970-01-01T00:00:00.000Z",
    },
    members: [],
    messages: [],
  },
  groupId: 0,
  appendMessage: function () {},
  deleteSentMsg: function () {},
  toggleGroupInfo: function () {},
};

export const GroupContext = createContext(GROUP_CONTEXT_DEFAULT);

function Room() {
  let { groupId } = useParams();
  groupId = Number(groupId);
  const userData = useLoaderData();

  let [groupData, setGroupData] = useState(GROUP_CONTEXT_DEFAULT.groupData);
  let [isGroupInfoShown, setIsGroupInfoShown] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/group/" + groupId, {
      signal: controller.signal,
    });

    fetch(request)
      .then((res) => res.json())
      .then((data) => {
        setGroupData(data);
      })
      .catch(() => {});

    return () => {
      controller.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, [groupId]);

  useEffect(() => {
    function addNewMessage(message) {
      if (message.group_id !== groupId) return;
      appendMessage(message);
    }

    window.socket.on("message", addNewMessage);

    return () => {
      window.socket.off("message", addNewMessage);
    };
  }, [groupId]);

  useEffect(() => {
    function clearSocketSentData() {
      window.socket.sendBuffer = [];
      window.socket._clearAcks();
    }

    return () => {
      clearSocketSentData();
    };
  }, [groupId]);

  function appendMessage(message) {
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
          groupId,
          appendMessage,
          deleteSentMsg,
          toggleGroupInfo,
        }}
      >
        {isGroupInfoShown ? <GroupInfo /> : <GroupList />}
        <RoomUI />
      </GroupContext.Provider>
    </div>
  );
}

export default Room;

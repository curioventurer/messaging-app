import { useContext } from "react";
import { GroupContext } from "./Room.jsx";
import DateFormat from "../controllers/DateFormat.js";

function RoomHeader() {
  const { groupData, isGroupChat, toggleGroupInfo } = useContext(GroupContext);
  const chat = groupData.isGroup ? groupData.group : groupData.direct;

  return (
    <button
      className="room-header"
      onClick={isGroupChat ? toggleGroupInfo : null}
    >
      <h1>{chat.name}</h1>
      <p>
        Created on{" "}
        <time dateTime={chat.created}>
          {DateFormat.timestamp(chat.created)}
        </time>
      </p>
    </button>
  );
}

export default RoomHeader;

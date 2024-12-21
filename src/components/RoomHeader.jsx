import { useContext } from "react";
import { GroupContext } from "./Room.jsx";
import DateFormat from "../controllers/DateFormat.js";

function RoomHeader() {
  const { groupData, chatId, toggleGroupInfo } = useContext(GroupContext);
  const chat = groupData.isGroup ? groupData.group : groupData.direct;

  return (
    <button
      className="room-header"
      onClick={chatId.isGroup ? toggleGroupInfo : null}
    >
      <h1>{chat.name}</h1>
      {chatId.isGroup ? (
        <p>
          Created on{" "}
          <time dateTime={chat.created}>
            {DateFormat.timestamp(chat.created)}
          </time>
        </p>
      ) : null}
    </button>
  );
}

export default RoomHeader;

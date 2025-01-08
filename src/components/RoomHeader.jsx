import { useContext } from "react";
import { ChatContext } from "./Room.jsx";
import DateFormat from "../controllers/DateFormat.js";

function RoomHeader() {
  const { chatData, chatId, toggleChatInfo } = useContext(ChatContext);
  const chat = chatData.isGroup ? chatData.group : chatData.direct;

  return (
    <button
      className="room-header"
      onClick={chatId.isGroup ? toggleChatInfo : null}
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

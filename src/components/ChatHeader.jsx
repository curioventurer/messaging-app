import { useContext } from "react";
import { ChatContext } from "./ChatRoom.jsx";
import DateFormat from "../controllers/DateFormat.js";

function ChatHeader() {
  const { chatData, toggleChatInfo } = useContext(ChatContext);
  const room = chatData.room;

  return (
    <button className="chat-header" onClick={toggleChatInfo}>
      <h1>{room.name}</h1>
      <p>
        Created on{" "}
        <time dateTime={room.created}>
          {DateFormat.timestamp(room.created)}
        </time>
      </p>
    </button>
  );
}

export default ChatHeader;

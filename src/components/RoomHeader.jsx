import { useContext } from "react";
import { RoomContext, ChatContext } from "./Room.jsx";

function RoomHeader() {
  const { toggleChatInfo } = useContext(RoomContext);
  const { chatData } = useContext(ChatContext);
  const chat = chatData.isGroup ? chatData.group : chatData.direct;

  return (
    <button className="room-header" onClick={toggleChatInfo}>
      <h1 className="clipped-text">{chat.name}</h1>
      <p>click for info</p>
    </button>
  );
}

export default RoomHeader;

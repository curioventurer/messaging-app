import { useEffect, useRef, useContext } from "react";
import { RoomContext, ChatContext } from "./Room.jsx";

function RoomHeader() {
  const { toggleRoomInfo, storeRoomHeaderRef } = useContext(RoomContext);
  const { chatData } = useContext(ChatContext);
  const buttonRef = useRef(null);

  useEffect(() => {
    storeRoomHeaderRef(buttonRef.current);
  }, [storeRoomHeaderRef]);

  const chat = chatData.isGroup ? chatData.group : chatData.direct;

  return (
    <button className="room-header" ref={buttonRef} onClick={toggleRoomInfo}>
      <h1 className="clipped-text">{chat.name}</h1>
      <p>click for info</p>
    </button>
  );
}

export default RoomHeader;

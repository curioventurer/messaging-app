import { useEffect, useRef, useContext } from "react";
import { RoomContext, ChatContext } from "./Room.jsx";
import { DEFAULT_TEXT } from "../../controllers/chat-data.js";

function RoomHeader() {
  const { toggleRoomInfo, storeRoomHeaderRef } = useContext(RoomContext);
  const { chatData } = useContext(ChatContext);
  const buttonRef = useRef(null);

  useEffect(() => {
    storeRoomHeaderRef(buttonRef.current);
  }, [storeRoomHeaderRef]);

  let name;
  if (chatData)
    name = (chatData.isGroup ? chatData.group : chatData.direct).name;
  else name = DEFAULT_TEXT;

  return (
    <button className="room-header" ref={buttonRef} onClick={toggleRoomInfo}>
      <h1 className="clipped-text">{name}</h1>
      <p>click for info</p>
    </button>
  );
}

export default RoomHeader;

import { useEffect, useRef, useContext } from "react";
import { RoomContext } from "./Room.jsx";
import { DEFAULT_TEXT } from "../../../js/chat-data.js";

function RoomHeader() {
  const { room, toggleRoomInfo, storeRoomHeaderRef } = useContext(RoomContext);
  const buttonRef = useRef(null);

  useEffect(() => {
    storeRoomHeaderRef(buttonRef.current);
  }, [storeRoomHeaderRef]);

  const name = room ? room.name : DEFAULT_TEXT;

  return (
    <button
      className="room-header clear-background hover-whitening"
      ref={buttonRef}
      onClick={toggleRoomInfo}
    >
      <h1 className="clipped-text">{name}</h1>
      <p>click for info</p>
    </button>
  );
}

export default RoomHeader;

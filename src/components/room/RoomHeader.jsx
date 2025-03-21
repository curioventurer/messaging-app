import { useContext } from "react";
import { RoomContext } from "./Room.jsx";
import { DEFAULT_TEXT } from "../../../js/chat-data.js";

function RoomHeader() {
  const { room, roomHeader, updateRoomInfoIsShown } = useContext(RoomContext);

  const name = room ? room.name : DEFAULT_TEXT;

  return (
    <button
      className="room-header clear-background hover-whitening"
      ref={roomHeader}
      onClick={() => {
        updateRoomInfoIsShown();
      }}
    >
      <h1 className="clipped-text">{name}</h1>
      <p>click for info</p>
    </button>
  );
}

export default RoomHeader;

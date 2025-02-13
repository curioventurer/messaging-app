import { useContext } from "react";
import GroupInfo from "./GroupInfo.jsx";
import DirectInfo from "./DirectInfo.jsx";
import { RoomContext } from "./Room.jsx";

function RoomInfo() {
  const { chatId, toggleRoomInfo } = useContext(RoomContext);

  return (
    <div className="room-info narrow-width">
      <div className="room-info-header">
        <p>{chatId.isGroup ? "Group Info" : "Direct Chat Info"}</p>
        <button
          className="icon"
          aria-label="close info"
          onClick={toggleRoomInfo}
          autoFocus
        >
          <span aria-hidden>&#x2A2F;</span>
        </button>
      </div>
      {chatId.isGroup ? <GroupInfo /> : <DirectInfo />}
    </div>
  );
}

export default RoomInfo;

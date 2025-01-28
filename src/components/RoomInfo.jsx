import { useContext } from "react";
import GroupInfo from "./GroupInfo.jsx";
import DirectInfo from "./DirectInfo.jsx";
import { ChatContext } from "./Room.jsx";

function RoomInfo() {
  const { chatId, toggleChatInfo } = useContext(ChatContext);

  return (
    <div className="room-info narrow-width">
      <div className="room-info-header">
        <p>{chatId.isGroup ? "Group Info" : "Direct Chat Info"}</p>
        <button onClick={toggleChatInfo}>&#x2A2F;</button>
      </div>
      {chatId.isGroup ? <GroupInfo /> : <DirectInfo />}
    </div>
  );
}

export default RoomInfo;

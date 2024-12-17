import { useContext } from "react";
import RoomHeader from "./RoomHeader";
import MessageList from "./MessageList";
import MessagingForm from "./MessagingForm";
import { GroupContext } from "./Room.jsx";

function RoomUI() {
  const { isGroupChat } = useContext(GroupContext);

  return (
    <div className="room-interface">
      {isGroupChat ? <RoomHeader /> : <div className="room-header">Test</div>}
      <MessageList />
      <MessagingForm />
    </div>
  );
}

export default RoomUI;

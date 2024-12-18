import RoomHeader from "./RoomHeader";
import MessageList from "./MessageList";
import MessagingForm from "./MessagingForm";

function RoomUI() {
  return (
    <div className="room-interface">
      <RoomHeader />
      <MessageList />
      <MessagingForm />
    </div>
  );
}

export default RoomUI;

import PropTypes from "prop-types";
import RoomHeader from "./RoomHeader.jsx";
import MessageList from "./MessageList.jsx";
import MessagingForm from "./MessagingForm.jsx";

function RoomUI({ roomInfoIsShown }) {
  const className =
    "room-interface wide-width" +
    (roomInfoIsShown ? " low-priority-display" : "");

  return (
    <div className={className}>
      <RoomHeader />
      <MessageList />
      <MessagingForm />
    </div>
  );
}

RoomUI.propTypes = {
  roomInfoIsShown: PropTypes.bool.isRequired,
};

export default RoomUI;

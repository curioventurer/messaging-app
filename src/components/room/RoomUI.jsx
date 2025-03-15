import PropTypes from "prop-types";
import RoomHeader from "./RoomHeader.jsx";
import MessageList from "./MessageList.jsx";
import MessagingForm from "./MessagingForm.jsx";

function RoomUI({ roomInfoIsShown, roomInfoIsExpanded }) {
  const className =
    "room-interface wide-width" +
    (roomInfoIsShown ? " low-priority-display" : "") +
    (roomInfoIsExpanded ? " remove" : "");

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
  roomInfoIsExpanded: PropTypes.bool.isRequired,
};

export default RoomUI;

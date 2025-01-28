import PropTypes from "prop-types";
import RoomHeader from "./RoomHeader";
import MessageList from "./MessageList";
import MessagingForm from "./MessagingForm";

function RoomUI({ isChatInfoShown }) {
  const className =
    "room-interface wide-width" +
    (isChatInfoShown ? " low-priority-display" : "");

  return (
    <div className={className}>
      <RoomHeader />
      <MessageList />
      <MessagingForm />
    </div>
  );
}

RoomUI.propTypes = {
  isChatInfoShown: PropTypes.bool.isRequired,
};

export default RoomUI;

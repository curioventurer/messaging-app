import PropTypes from "prop-types";
import RoomHeader from "./RoomHeader.jsx";
import MessageList from "./MessageList.jsx";
import MessagingForm from "./MessagingForm.jsx";

function RoomUI({ className = "" }) {
  const class_name = "room-interface wide-width " + className;

  return (
    <div className={class_name}>
      <RoomHeader />
      <MessageList />
      <MessagingForm />
    </div>
  );
}

RoomUI.propTypes = {
  className: PropTypes.string,
};

export default RoomUI;

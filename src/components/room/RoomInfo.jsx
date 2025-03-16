import { useEffect, useRef, useContext } from "react";
import PropTypes from "prop-types";
import GroupInfo from "./GroupInfo.jsx";
import DirectInfo from "./DirectInfo.jsx";
import { RoomContext } from "./Room.jsx";

function RoomInfo({ className = "", roomInfoIsShown, roomInfoIsExpanded }) {
  const { chatId, updateRoomInfoIsShown, updateRoomInfoIsExpanded } =
    useContext(RoomContext);
  const closeButton = useRef(null);

  useEffect(() => {
    if (roomInfoIsShown) closeButton.current.focus();
  }, [roomInfoIsShown]);

  return (
    <div
      className={
        "room-info " +
        (roomInfoIsExpanded ? "wide-width" : "narrow-width") +
        " " +
        className
      }
    >
      <div className="room-info-header">
        <h2>{chatId.isGroup ? "Group Info" : "Direct Chat Info"}</h2>
        <div className="button-bar">
          <button
            className="clear-background"
            onClick={() => {
              updateRoomInfoIsExpanded();
            }}
          >
            {roomInfoIsExpanded ? "shrink" : "expand"}
          </button>
          <button
            ref={closeButton}
            className="icon close clear-background hover-whitening"
            aria-label="close info"
            onClick={() => {
              updateRoomInfoIsShown();
            }}
          >
            <span aria-hidden>&#x2A2F;</span>
          </button>
        </div>
      </div>
      {chatId.isGroup ? <GroupInfo /> : <DirectInfo />}
    </div>
  );
}

RoomInfo.propTypes = {
  className: PropTypes.string,
  roomInfoIsShown: PropTypes.bool,
  roomInfoIsExpanded: PropTypes.bool,
};

export default RoomInfo;

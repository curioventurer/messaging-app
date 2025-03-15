import { useContext } from "react";
import PropTypes from "prop-types";
import GroupInfo from "./GroupInfo.jsx";
import DirectInfo from "./DirectInfo.jsx";
import { RoomContext } from "./Room.jsx";

function RoomInfo({ roomInfoIsShown, roomInfoIsExpanded }) {
  const { chatId, updateRoomInfoIsShown, updateRoomInfoIsExpanded } =
    useContext(RoomContext);

  return (
    <div
      className={
        "room-info " +
        (roomInfoIsExpanded ? "wide-width" : "narrow-width") +
        (!roomInfoIsShown ? " remove" : "")
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
            className="icon close clear-background hover-whitening"
            aria-label="close info"
            onClick={() => {
              updateRoomInfoIsShown();
            }}
            autoFocus
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
  roomInfoIsShown: PropTypes.bool.isRequired,
  roomInfoIsExpanded: PropTypes.bool.isRequired,
};

export default RoomInfo;

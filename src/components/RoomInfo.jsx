import { useContext } from "react";
import PropTypes from "prop-types";
import GroupInfo from "./GroupInfo";
import DirectInfo from "./DirectInfo";
import { RoomContext } from "./Room";

function RoomInfo({ roomInfoIsExpanded }) {
  const { chatId, toggleRoomInfo, toggleExpandRoomInfo } =
    useContext(RoomContext);

  return (
    <div
      className={
        "room-info " + (roomInfoIsExpanded ? "wide-width" : "narrow-width")
      }
    >
      <div className="room-info-header">
        <h2>{chatId.isGroup ? "Group Info" : "Direct Chat Info"}</h2>
        <div className="button-bar">
          <button className="clear-background" onClick={toggleExpandRoomInfo}>
            {roomInfoIsExpanded ? "shrink" : "expand"}
          </button>
          <button
            className="icon close clear-background hover-whitening"
            aria-label="close info"
            onClick={toggleRoomInfo}
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
  roomInfoIsExpanded: PropTypes.bool.isRequired,
};

export default RoomInfo;

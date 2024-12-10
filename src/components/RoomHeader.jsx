import { useContext } from "react";
import { GroupContext } from "./Room.jsx";
import DateFormat from "../controllers/DateFormat.js";

function RoomHeader() {
  const { groupData, toggleGroupInfo } = useContext(GroupContext);
  const group = groupData.group;

  return (
    <button className="room-header" onClick={toggleGroupInfo}>
      <h1>{group.name}</h1>
      <p>
        Created on{" "}
        <time dateTime={group.created}>
          {DateFormat.timestamp(group.created)}
        </time>
      </p>
    </button>
  );
}

export default RoomHeader;

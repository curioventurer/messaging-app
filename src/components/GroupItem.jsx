import { useContext } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { GroupContext } from "./Room.jsx";
import DateFormat from "../controllers/DateFormat.js";

function GroupItem({ group }) {
  const { groupId } = useContext(GroupContext);
  const lastMessage = group.lastMessage;

  const created = lastMessage ? lastMessage.created : group.joined;
  const displayDate = DateFormat.timestamp(created);

  return (
    <Link
      to={"/group/" + group.id}
      className={
        "button-link" + (groupId === group.id ? " button-highlight" : "")
      }
    >
      <div className="group-item-header">
        <p>{group.name}</p>
        <time dateTime={created}>{displayDate}</time>
      </div>
      <p className="clipped-text">
        {lastMessage
          ? `${lastMessage.name}: ${lastMessage.text}`
          : "Joined group"}
      </p>
    </Link>
  );
}

GroupItem.propTypes = {
  group: PropTypes.object.isRequired,
};

export default GroupItem;

import { useContext, memo } from "react";
import PropTypes from "prop-types";
import useDuration from "../../hooks/useDuration.jsx";
import { RoomContext } from "./Room";
import { Member } from "../../../js/chat-data.js";

function PendingMemberItem({ member }) {
  const { room } = useContext(RoomContext);

  const power = room.membership.getPower();
  const duration = useDuration(member.modified);

  return (
    <tr>
      <td className="clipped-text">{member.name}</td>
      <td>{duration}</td>
      <td>
        {power > 0 ? (
          <ul className="button-bar">
            <li>
              <button>Accept</button>
            </li>
            <li>
              <button>Reject</button>
            </li>
          </ul>
        ) : null}
      </td>
    </tr>
  );
}

PendingMemberItem.propTypes = {
  member: PropTypes.instanceOf(Member).isRequired,
};

export default memo(PendingMemberItem);

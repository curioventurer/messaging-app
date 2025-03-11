import { useContext, memo } from "react";
import PropTypes from "prop-types";
import useDuration from "../../hooks/useDuration.jsx";
import { RoomContext } from "./Room";
import { Member } from "../../../js/chat-data.js";

function RejectedMemberItem({ member }) {
  const { room } = useContext(RoomContext);

  const power = room.membership.getPower();
  const duration = useDuration(member.modified);

  return (
    <tr>
      <td className="clipped-text">{member.name}</td>
      <td>{duration}</td>
      <td>
        <ul className="button-bar">
          {power > 0 ? (
            <li>
              <button>Accept</button>
            </li>
          ) : null}
        </ul>
      </td>
    </tr>
  );
}

RejectedMemberItem.propTypes = {
  member: PropTypes.instanceOf(Member).isRequired,
};

export default memo(RejectedMemberItem);

import { useContext, memo } from "react";
import PropTypes from "prop-types";
import useDuration from "../../hooks/useDuration.jsx";
import { RoomContext } from "./Room";
import { Member, RequestStatus } from "../../../js/chat-data.js";

function AppliedMemberItem({ member }) {
  const { room } = useContext(RoomContext);

  const power = room.membership.getPower();
  const duration = useDuration(member.modified);

  return (
    <tr>
      <td className="clipped-text">{member.name}</td>
      <td>{duration}</td>
      <td>
        <ul className="button-bar">
          {power > 0 && member.state === RequestStatus.PENDING ? (
            <>
              <li>
                <button>Accept</button>
              </li>
              <li>
                <button>Reject</button>
              </li>
            </>
          ) : null}
          {power > 0 && member.state === RequestStatus.REJECTED ? (
            <li>
              <button>Accept</button>
            </li>
          ) : null}
        </ul>
      </td>
    </tr>
  );
}

AppliedMemberItem.propTypes = {
  member: PropTypes.instanceOf(Member).isRequired,
};

export default memo(AppliedMemberItem);

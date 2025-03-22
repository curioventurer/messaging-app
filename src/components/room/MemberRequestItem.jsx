import { useContext, memo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import useDuration from "../../hooks/useDuration.jsx";
import { RoomContext } from "./Room.jsx";
import { socket } from "../../controllers/socket.js";
import { Member, RequestStatus } from "../../../js/chat-data.js";

function MemberRequestItem({ member }) {
  const { room } = useContext(RoomContext);

  const power = room.membership.getPower();
  const duration = useDuration(member.modified);

  function putMemberRequest(state = RequestStatus.ACCEPTED) {
    socket.emit("putMemberRequest", {
      id: member.id,
      state,
    });
  }

  return (
    <tr>
      <td className="clipped-text">{member.name}</td>
      <td>{duration}</td>
      <td>
        <ul className="button-bar">
          <li>
            <Link to={"/profile/" + member.user_id} className="button-link">
              Profile
            </Link>
          </li>
          {power > 0 && member.state === RequestStatus.PENDING ? (
            <>
              <li>
                <button
                  onClick={() => {
                    putMemberRequest(RequestStatus.ACCEPTED);
                  }}
                >
                  Accept
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    putMemberRequest(RequestStatus.REJECTED);
                  }}
                >
                  Reject
                </button>
              </li>
            </>
          ) : null}
          {power > 0 && member.state === RequestStatus.REJECTED ? (
            <li>
              <button
                onClick={() => {
                  putMemberRequest(RequestStatus.ACCEPTED);
                }}
              >
                Accept
              </button>
            </li>
          ) : null}
        </ul>
      </td>
    </tr>
  );
}

MemberRequestItem.propTypes = {
  member: PropTypes.instanceOf(Member).isRequired,
};

export default memo(MemberRequestItem);

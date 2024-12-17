import PropTypes from "prop-types";
import { FRIEND_REQUEST_TYPE } from "../controllers/constants.js";

function FriendItemButtonBar({ friend }) {
  function answerRequest(event) {
    window.socket.emit("friend request update", {
      id: friend.id,
      state: event.target.value,
    });
  }

  return (
    <>
      {friend.state === FRIEND_REQUEST_TYPE.PENDING && friend.is_initiator ? (
        <ul className="button-bar">
          <li>
            <button
              onClick={answerRequest}
              value={FRIEND_REQUEST_TYPE.ACCEPTED}
            >
              Accept
            </button>
          </li>
          <li>
            <button
              onClick={answerRequest}
              value={FRIEND_REQUEST_TYPE.REJECTED}
            >
              Reject
            </button>
          </li>
        </ul>
      ) : null}
    </>
  );
}

FriendItemButtonBar.propTypes = {
  friend: PropTypes.object.isRequired,
};

export default FriendItemButtonBar;

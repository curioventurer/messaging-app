import { useEffect, useState, memo } from "react";
import PropTypes from "prop-types";
import FriendButtonBar from "./FriendButtonBar";
import DurationFormat from "../controllers/DurationFormat.js";
import { User, FriendRequest } from "../../js/chat-data.js";

function UserItem({ user }) {
  const [duration, setDuration] = useState("");

  //is defined - non default values.
  const friendshipIsDefined = user.friendship.isDefined();

  const modified = user.friendship.modified;
  useEffect(() => {
    const DELAY = 5000;

    if (!friendshipIsDefined) return; //don't set interval;

    function updateDuration() {
      setDuration(DurationFormat.getString(modified));
    }
    updateDuration();

    const interval = setInterval(updateDuration, DELAY);

    return () => {
      clearInterval(interval);
    };
  }, [modified, friendshipIsDefined]);

  let friendshipStatus;

  if (!friendshipIsDefined) friendshipStatus = "";
  else if (user.friendship.state === FriendRequest.ACCEPTED)
    friendshipStatus = "friends";
  else if (user.friendship.state === FriendRequest.PENDING) {
    friendshipStatus = user.friendship.is_initiator ? (
      <>
        {"received - "}
        <time>{duration}</time>
      </>
    ) : (
      <>
        {"sent - "}
        <time>{duration}</time>
      </>
    );
  } else if (user.friendship.state === FriendRequest.REJECTED) {
    friendshipStatus = user.friendship.is_initiator ? (
      <>
        {"you reject - "}
        <time>{duration}</time>
      </>
    ) : (
      <>
        {"target reject - "}
        <time>{duration}</time>
      </>
    );
  }

  return (
    <tr>
      <td>
        <p className="clipped-text bold">{user.name}</p>
      </td>
      <td>
        <p className="clipped-text">{friendshipStatus}</p>
      </td>
      <td>
        <FriendButtonBar friend={user.friendship} />
      </td>
    </tr>
  );
}

UserItem.propTypes = {
  user: PropTypes.instanceOf(User).isRequired,
};

export default memo(UserItem);

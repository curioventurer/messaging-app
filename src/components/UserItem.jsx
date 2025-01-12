import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import FriendButtonBar from "./FriendButtonBar";
import { FriendRequest } from "../controllers/chat-data";
import DurationFormat from "../controllers/DurationFormat";

function UserItem({ user }) {
  const [duration, setDuration] = useState("");

  const modified = user.friendship?.modified;
  useEffect(() => {
    if (!modified) return;

    function updateDuration() {
      setDuration(DurationFormat.getString(modified));
    }
    updateDuration();

    const interval = setInterval(updateDuration, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [modified]);

  let friendshipStatus;

  if (!user.friendship);
  else if (user.friendship.state === FriendRequest.ACCEPTED)
    friendshipStatus = "friends";
  else if (user.friendship.state === FriendRequest.PENDING) {
    friendshipStatus = user.friendship.is_initiator ? (
      <p>
        {"received - "}
        <time>{duration}</time>
      </p>
    ) : (
      <p>
        {"sent - "}
        <time>{duration}</time>
      </p>
    );
  } else if (user.friendship.state === FriendRequest.REJECTED) {
    friendshipStatus = user.friendship.is_initiator ? (
      <p>
        {"you reject - "}
        <time>{duration}</time>
      </p>
    ) : (
      <p>
        {"target reject - "}
        <time>{duration}</time>
      </p>
    );
  }

  return (
    <tr>
      <td className="clipped-text">{user.name}</td>
      <td>{friendshipStatus}</td>
      <td>
        <FriendButtonBar
          friend={user.friendship ? user.friendship : { user_id: user.id }}
        />
      </td>
    </tr>
  );
}

UserItem.propTypes = {
  user: PropTypes.object.isRequired,
};

export default UserItem;

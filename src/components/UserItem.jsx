import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import FriendItemButtonBar from "./FriendItemButtonBar";
import { FRIEND_REQUEST_TYPE } from "../controllers/constants";
import DurationFormat from "../controllers/DurationFormat";

function UserItem({ user }) {
  let [duration, setDuration] = useState("");

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

  function addFriend() {
    window.socket.emit("add friend", {
      id: user.id,
    });
  }

  function reverseRequest() {
    window.socket.emit("reverse friend request", {
      id: user.friendship.id,
    });
  }

  let friendshipPanel;
  if (!user.friendship)
    friendshipPanel = <button onClick={addFriend}>Add</button>;
  else if (user.friendship.state === FRIEND_REQUEST_TYPE.ACCEPTED)
    friendshipPanel = <p>friends</p>;
  else if (
    user.friendship.state === FRIEND_REQUEST_TYPE.PENDING &&
    user.friendship.initiator
  )
    friendshipPanel = (
      <p>
        {"request sent "}
        <time>{duration}</time>
      </p>
    );
  else if (
    user.friendship.state === FRIEND_REQUEST_TYPE.PENDING &&
    !user.friendship.initiator
  )
    friendshipPanel = <FriendItemButtonBar friend={user.friendship} />;
  else if (
    user.friendship.state === FRIEND_REQUEST_TYPE.REJECTED &&
    user.friendship.initiator
  )
    friendshipPanel = (
      <p>
        {"target rejected "}
        <time>{duration}</time>
      </p>
    );
  else if (
    user.friendship.state === FRIEND_REQUEST_TYPE.REJECTED &&
    !user.friendship.initiator
  )
    friendshipPanel = (
      <p>
        {"you reject "}
        <time>{duration}</time>
        <button onClick={reverseRequest}>Add</button>
      </p>
    );

  return (
    <>
      <p className="clipped-text">{user.name}</p>
      {friendshipPanel}
    </>
  );
}

UserItem.propTypes = {
  user: PropTypes.object.isRequired,
};

export default UserItem;

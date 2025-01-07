import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import FriendItemButtonBar from "./FriendItemButtonBar";
import { FRIEND_REQUEST_TYPE } from "../controllers/constants";
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

  let itemsArray = [];
  if (!user.friendship)
    itemsArray.push(
      <button key="add" onClick={addFriend}>
        Add
      </button>,
    );
  else if (user.friendship.state === FRIEND_REQUEST_TYPE.ACCEPTED)
    itemsArray.push(<p key="text">friends</p>);
  else if (
    user.friendship.state === FRIEND_REQUEST_TYPE.PENDING &&
    !user.friendship.is_initiator
  )
    itemsArray.push(
      <p key="text">
        {"request sent "}
        <time>{duration}</time>
      </p>,
    );
  else if (
    user.friendship.state === FRIEND_REQUEST_TYPE.REJECTED &&
    !user.friendship.is_initiator
  )
    itemsArray.push(
      <p key="text">
        {"target rejected "}
        <time>{duration}</time>
      </p>,
    );
  else if (
    user.friendship.state === FRIEND_REQUEST_TYPE.REJECTED &&
    user.friendship.is_initiator
  ) {
    itemsArray.push(
      <p key="text">
        {"you reject "}
        <time>{duration}</time>
      </p>,
    );
    itemsArray.push(
      <button key="add" onClick={reverseRequest}>
        Add
      </button>,
    );
  }

  if (user.friendship)
    itemsArray.push(
      <FriendItemButtonBar key="buttonBar" friend={user.friendship} />,
    );

  return (
    <>
      <p className="clipped-text">{user.name}</p>
      <div className="items-array">{itemsArray}</div>
    </>
  );
}

UserItem.propTypes = {
  user: PropTypes.object.isRequired,
};

export default UserItem;

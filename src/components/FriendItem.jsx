import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import FriendButtonBar from "./FriendButtonBar";
import DurationFormat from "../controllers/DurationFormat.js";
import { UserActivity, FriendRequest } from "../controllers/chat-data.js";

function FriendItem({ friend }) {
  const [duration, setDuration] = useState("");

  useEffect(() => {
    function updateDuration() {
      setDuration(DurationFormat.getString(friend.modified));
    }
    updateDuration();

    const interval = setInterval(updateDuration, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [friend.modified]);

  function getActivityDisplay(activity) {
    const string = UserActivity.getString(activity);
    const capitalized = string.charAt(0).toUpperCase() + string.slice(1);

    return <span className={"status " + string}>{capitalized}</span>;
  }

  return (
    <>
      <p className="clipped-text">{friend.name}</p>
      <div className="details">
        <p>
          {friend.state === FriendRequest.ACCEPTED ? (
            getActivityDisplay(friend.activity)
          ) : (
            <time>{duration}</time>
          )}
        </p>
        <FriendButtonBar friend={friend} />
      </div>
    </>
  );
}

FriendItem.propTypes = {
  friend: PropTypes.object.isRequired,
};

export default FriendItem;

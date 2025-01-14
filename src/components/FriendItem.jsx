import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import FriendButtonBar from "./FriendButtonBar";
import DurationFormat from "../controllers/DurationFormat.js";
import {
  UserFriendship,
  FriendRequest,
  UserActivity,
} from "../controllers/chat-data.js";

function FriendItem({ friend = new UserFriendship({}) }) {
  const [duration, setDuration] = useState("");

  const activity = friend.activity;
  const isFriend = friend.state === FriendRequest.ACCEPTED;
  const time = isFriend ? friend.last_seen : friend.modified;

  useEffect(() => {
    function updateDuration() {
      setDuration(DurationFormat.getString(time));
    }
    updateDuration();

    const interval = setInterval(updateDuration, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [time]);

  let status;
  if (activity === UserActivity.OFFLINE) {
    status = (
      <>
        {"Last seen "}
        <time>{duration}</time>
      </>
    );
  } else status = activity.charAt(0).toUpperCase() + activity.slice(1);

  return (
    <>
      <p className="clipped-text">{friend.name}</p>
      <div className="details">
        {isFriend ? (
          <p className={"status " + activity}>{status}</p>
        ) : (
          <time>{duration}</time>
        )}
        <FriendButtonBar friend={friend} />
      </div>
    </>
  );
}

FriendItem.propTypes = {
  friend: PropTypes.instanceOf(UserFriendship).isRequired,
};

export default FriendItem;

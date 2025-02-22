import { useEffect, useState, memo } from "react";
import PropTypes from "prop-types";
import FriendButtonBar from "./FriendButtonBar";
import DurationFormat from "../../controllers/DurationFormat.js";
import {
  User,
  UserFriendship,
  FriendRequest,
} from "../../controllers/chat-data.js";

function FriendItem({ friend = new UserFriendship({}) }) {
  const [duration, setDuration] = useState("");

  const activity = friend.activity;
  const isFriend = friend.state === FriendRequest.ACCEPTED;
  const time = isFriend ? friend.last_seen : friend.modified;

  useEffect(() => {
    const DELAY = 5000;

    function updateDuration() {
      setDuration(DurationFormat.getString(time));
    }
    updateDuration();

    const interval = setInterval(updateDuration, DELAY);

    return () => {
      clearInterval(interval);
    };
  }, [time]);

  let status;
  if (activity === User.ACTIVITY_TYPE.OFFLINE) {
    status = (
      <>
        {"Last seen "}
        <time>{duration}</time>
      </>
    );
  } else status = activity.charAt(0).toUpperCase() + activity.slice(1);

  return (
    <>
      <p className="name clipped-text">{friend.name}</p>
      <div className="details">
        {isFriend ? (
          <p className={"clipped-text status " + activity}>{status}</p>
        ) : (
          <time className="clipped-text">{duration}</time>
        )}
        <FriendButtonBar friend={friend} />
      </div>
    </>
  );
}

FriendItem.propTypes = {
  friend: PropTypes.instanceOf(UserFriendship).isRequired,
};

export default memo(FriendItem);

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import FriendItemButtonBar from "./FriendItemButtonBar";
import getDuration from "../controllers/getDuration.js";

function getDurationString(date) {
  const duration = getDuration(date);
  const string =
    duration.value +
    " " +
    duration.type +
    (duration.value !== 1 ? "s" : "") +
    " ago";

  return string;
}

function FriendItem({ friend }) {
  let [duration, setDuration] = useState("");

  useEffect(() => {
    function updateDuration() {
      setDuration(getDurationString(friend.modified));
    }
    updateDuration();

    const interval = setInterval(() => {
      updateDuration();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [friend.modified]);

  return (
    <>
      <p className="clipped-text">{friend.name}</p>
      <div className="details">
        <time>{duration}</time>
        <FriendItemButtonBar friend={friend} />
      </div>
    </>
  );
}

FriendItem.propTypes = {
  friend: PropTypes.object.isRequired,
};

export default FriendItem;

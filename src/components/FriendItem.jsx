import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import FriendButtonBar from "./FriendButtonBar";
import DurationFormat from "../controllers/DurationFormat.js";

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

  return (
    <>
      <p className="clipped-text">{friend.name}</p>
      <div className="details">
        <time>{duration}</time>
        <FriendButtonBar friend={friend} />
      </div>
    </>
  );
}

FriendItem.propTypes = {
  friend: PropTypes.object.isRequired,
};

export default FriendItem;

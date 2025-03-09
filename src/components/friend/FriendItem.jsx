import { memo } from "react";
import PropTypes from "prop-types";
import useDuration from "../../hooks/useDuration";
import FriendButtonBar from "./FriendButtonBar";
import { User, UserFriendship, RequestStatus } from "../../../js/chat-data.js";

function FriendItem({ friend = new UserFriendship({}) }) {
  const activity = friend.activity;
  const isFriend = friend.state === RequestStatus.ACCEPTED;
  const time = isFriend ? friend.last_seen : friend.modified;

  const duration = useDuration(time);

  let status;
  if (activity === User.ACTIVITY.OFFLINE) {
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

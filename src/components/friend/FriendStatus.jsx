import PropTypes from "prop-types";
import useDuration from "../../hooks/useDuration.jsx";
import { UserFriendship, User } from "../../../js/chat-data.js";

function FriendStatus({ friendship }) {
  const activity = friendship.activity;
  const time = friendship.modified;

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

  return <span className={"status " + activity}>{status}</span>;
}

FriendStatus.propTypes = {
  friendship: PropTypes.instanceOf(UserFriendship).isRequired,
};

export default FriendStatus;

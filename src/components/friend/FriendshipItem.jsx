import { memo } from "react";
import PropTypes from "prop-types";
import useDuration from "../../hooks/useDuration.jsx";
import FriendshipButtonBar from "./FriendshipButtonBar.jsx";
import { User, UserFriendship, RequestStatus } from "../../../js/chat-data.js";

function FriendshipItem({ friendship = new UserFriendship({}) }) {
  const activity = friendship.activity;
  const isFriend = friendship.state === RequestStatus.ACCEPTED;
  const time = isFriend ? friendship.last_seen : friendship.modified;

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
    <tr>
      <td>
        <p className="clipped-text bold">{friendship.name}</p>
      </td>
      <td>
        {isFriend ? (
          <p className={"clipped-text status " + activity}>{status}</p>
        ) : (
          <time className="clipped-text">{duration}</time>
        )}
      </td>
      <td>
        <FriendshipButtonBar friendship={friendship} />
      </td>
    </tr>
  );
}

FriendshipItem.propTypes = {
  friendship: PropTypes.instanceOf(UserFriendship).isRequired,
};

export default memo(FriendshipItem);

import { memo } from "react";
import PropTypes from "prop-types";
import useDuration from "../../hooks/useDuration.jsx";
import FriendStatus from "./FriendStatus.jsx";
import FriendshipButtonBar from "./FriendshipButtonBar.jsx";
import { UserFriendship } from "../../../js/chat-data.js";

function FriendshipItem({ friendship = new UserFriendship({}) }) {
  const isFriend = friendship.isAccepted();
  const time = isFriend ? friendship.last_seen : friendship.modified;

  const duration = useDuration(time);

  return (
    <tr>
      <td>
        <p className="clipped-text bold">{friendship.name}</p>
      </td>
      <td>
        {isFriend ? (
          <p className="clipped-text">
            <FriendStatus friendship={friendship} />
          </p>
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

import { memo } from "react";
import PropTypes from "prop-types";
import useDuration from "../../hooks/useDuration.jsx";
import FriendButtonBar from "../friend/FriendButtonBar.jsx";
import { User, RequestStatus } from "../../../js/chat-data.js";

function UserItem({ user }) {
  //is defined - non default values.
  const friendshipIsDefined = user.friendship.isDefined();
  const modified = user.friendship.modified;

  //Don't update duration if friendship not defined.
  const duration = useDuration(modified, !friendshipIsDefined);

  let friendshipStatus;

  if (!friendshipIsDefined) friendshipStatus = "";
  else if (user.friendship.state === RequestStatus.ACCEPTED)
    friendshipStatus = "friends";
  else if (user.friendship.state === RequestStatus.PENDING) {
    friendshipStatus = user.friendship.is_initiator ? (
      <>
        {"received - "}
        <time>{duration}</time>
      </>
    ) : (
      <>
        {"sent - "}
        <time>{duration}</time>
      </>
    );
  } else if (user.friendship.state === RequestStatus.REJECTED) {
    friendshipStatus = user.friendship.is_initiator ? (
      <>
        {"you reject - "}
        <time>{duration}</time>
      </>
    ) : (
      <>
        {"target reject - "}
        <time>{duration}</time>
      </>
    );
  }

  return (
    <tr>
      <td>
        <p className="clipped-text bold">{user.name}</p>
      </td>
      <td>
        <p className="clipped-text">{friendshipStatus}</p>
      </td>
      <td>
        <FriendButtonBar friend={user.friendship} />
      </td>
    </tr>
  );
}

UserItem.propTypes = {
  user: PropTypes.instanceOf(User).isRequired,
};

export default memo(UserItem);

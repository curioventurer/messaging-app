import PropTypes from "prop-types";
import useDuration from "../../hooks/useDuration.jsx";
import DateFormat from "../../controllers/DateFormat.js";
import { UserFriendship, RequestStatus } from "../../../js/chat-data.js";

function FriendshipDesc({ friendship }) {
  const friendshipIsDefined = friendship.isDefined();
  const timestamp = friendship.modified;
  const duration = useDuration(timestamp, !friendshipIsDefined);

  const timeElement = (
    <time dateTime={timestamp}>
      {DateFormat.timestamp(timestamp)} ({duration})
    </time>
  );

  let friendshipStatus;
  if (!friendshipIsDefined) friendshipStatus = "Not added";
  else if (friendship.isAccepted())
    friendshipStatus = (
      <>
        {"Since "}
        {timeElement}
      </>
    );
  else if (friendship.state === RequestStatus.PENDING) {
    friendshipStatus = friendship.is_initiator ? (
      <>
        {"Request received on "}
        {timeElement}
      </>
    ) : (
      <>
        {"Request sent on "}
        {timeElement}
      </>
    );
  } else if (friendship.state === RequestStatus.REJECTED) {
    friendshipStatus = friendship.is_initiator ? (
      <>
        {"You rejected on "}
        {timeElement}
      </>
    ) : (
      <>
        {"Your request rejected on "}
        {timeElement}
      </>
    );
  }

  return <>{friendshipStatus}</>;
}

FriendshipDesc.propTypes = {
  friendship: PropTypes.instanceOf(UserFriendship).isRequired,
};

export default FriendshipDesc;

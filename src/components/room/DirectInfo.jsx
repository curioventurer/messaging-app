import { useContext, useMemo, memo } from "react";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import FriendshipButtonBar from "../friend/FriendshipButtonBar.jsx";
import { RoomContext } from "./Room.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import { Group, UserFriendship } from "../../../js/chat-data.js";

function DirectInfo() {
  const { room } = useContext(RoomContext);
  const { friendships } = useContext(InterfaceContext);

  const excludedButtons = useMemo(() => ["chat"], []);

  //if not defined or contains old data of a different format.
  if (room === undefined || room instanceof Group)
    return <Loading name="direct chat info" />;
  else if (room === null) return <LoadFail name="direct chat info" />;
  else if (room === false) return <LoadError name="direct chat info" />;

  const friendship = friendships
    ? friendships.find((friend) => friend.user_id === room.user_id)
    : UserFriendship.createDefault(room.user_id, room.name);

  return (
    <>
      <p>{`This is your chat with "${room.name}".`}</p>
      <FriendshipButtonBar
        friendship={friendship}
        excluded={excludedButtons}
        className="s-block-margin"
      />
    </>
  );
}

export default memo(DirectInfo);

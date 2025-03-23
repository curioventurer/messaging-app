import { useEffect, useContext, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import PropTypes from "prop-types";
import useTitle from "../../hooks/useTitle.jsx";
import useFetchedState from "../../hooks/useFetchedState.jsx";
import useDuration from "../../hooks/useDuration.jsx";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import FriendshipDesc from "./FriendshipDesc.jsx";
import FriendStatus from "../friend/FriendStatus.jsx";
import FriendshipButtonBar from "../friend/FriendshipButtonBar.jsx";
import DeleteAccountButton from "./DeleteAccountButton.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import { socket } from "../../controllers/socket.js";
import DateFormat from "../../controllers/DateFormat.js";
import { DEFAULT_TEXT, User, UserFriendship } from "../../../js/chat-data.js";

//own: use own user_id from client or get from param.
function Profile({ own = false }) {
  const params = useParams();
  const { client, friendships } = useContext(InterfaceContext);

  const user_id = own ? client.id : parseInt(params.user_id);
  const isOwn = user_id === client.id;

  const parseUser = useCallback(function (data, setUser) {
    if (data === false) return setUser(false);

    setUser(new User(data));
  }, []);

  //contain instances of User - chat-data.js
  const [user, setUser] = useFetchedState({
    callback: parseUser,
    path: `/api/user/${user_id}`,
  });

  const friendshipData = friendships
    ? friendships.find((friend) => friend.user_id === user_id)
    : undefined;
  const friendship =
    friendshipData ?? UserFriendship.createDefault(user?.id, user?.name);

  const deleteUser = useCallback(
    function ({ user_id: id }) {
      if (user_id !== id) return;

      setUser((prevUser) => {
        if (!prevUser) return prevUser;

        const newUser = new User({
          ...prevUser.toJSON(),
          is_deleted: true,
        });
        return newUser;
      });
    },
    [user_id, setUser],
  );

  const username = user ? user.name : DEFAULT_TEXT;
  useTitle(!isOwn ? "Profile - " + username : "Your Profile");

  const duration = useDuration(user?.created);
  const excludedButtons = useMemo(() => ["profile"], []);

  useEffect(() => {
    socket.on("deleteUser", deleteUser);

    return () => {
      socket.off("deleteUser", deleteUser);
    };
  }, [deleteUser]);

  if (user === undefined) return <Loading name="profile" />;
  else if (user === null) return <LoadFail name="profile" />;
  else if (user === false) return <LoadError name="profile" />;

  return (
    <div className="profile-page">
      <h1>
        {isOwn ? "Your Profile" : "User Profile"}{" "}
        {user.is_deleted ? " (Deleted)" : ""}
      </h1>
      <ul className="list">
        <li>
          <span className="bold">Name:</span> {user.name}
        </li>
        <li>
          <span className="bold">ID:</span> {user.id}
        </li>
        <li>
          <span className="bold">Created on: </span>
          <time dateTime={user.created}>
            {DateFormat.timestamp(user.created)}{" "}
          </time>
          ({duration})
        </li>
        <li>
          <span className="bold">Guest account:</span> {String(user.is_guest)}
        </li>
        {!isOwn ? (
          <li>
            <span className="bold">Friend: </span>
            <FriendshipDesc friendship={friendship} />
          </li>
        ) : null}
        {friendship.isAccepted() ? (
          <li>
            <span className="bold">Status: </span>
            <FriendStatus friendship={friendship} />
          </li>
        ) : null}
      </ul>
      {!isOwn ? (
        <FriendshipButtonBar
          friendship={friendship}
          excluded={excludedButtons}
          className="s-block-margin"
        />
      ) : null}
      {isOwn ? <DeleteAccountButton /> : null}
    </div>
  );
}

Profile.propTypes = {
  own: PropTypes.bool,
};

export default Profile;

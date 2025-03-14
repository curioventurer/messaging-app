import { useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import FriendshipSection from "./FriendshipSection.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import { UpdateDirectIdContext } from "./FriendshipButtonBar.jsx";
import sortFriendships from "../../controllers/sortFriendships.js";
import clearSocket from "../../controllers/clearSocket.js";
import { allLinks } from "../../controllers/constant.js";
import {
  ChatItemData,
  User,
  UserFriendship,
  RequestStatus,
  UserActivity,
} from "../../../js/chat-data.js";

function FriendshipPanel() {
  const { friendships, updateFriendships } = useContext(InterfaceContext);

  const updateDirectId = useCallback(
    function (user_id, direct_chat_id) {
      updateFriendships((prevFriendships) => {
        if (!prevFriendships) return prevFriendships;

        const index = prevFriendships.findIndex(
          (friend) => friend.user_id === user_id,
        );
        if (index === -1) return prevFriendships;

        const friendship = new UserFriendship({
          ...prevFriendships[index],
          direct_chat_id,
        });

        const newFriendships = [
          ...prevFriendships.slice(0, index),
          friendship,
          ...prevFriendships.slice(index + 1),
        ];
        return newFriendships;
      });
    },
    [updateFriendships],
  );

  //Add or replace friendship entry.
  const updateFriendship = useCallback(
    function (friendshipData = new UserFriendship({})) {
      const friendship = new UserFriendship(friendshipData);

      updateFriendships((prevFriendships) => {
        if (!prevFriendships) return prevFriendships;

        const index = prevFriendships.findIndex(
          (friend) => friend.id === friendship.id,
        );

        let newFriendships;
        //add
        if (index === -1) newFriendships = [friendship, ...prevFriendships];
        //replace
        else
          newFriendships = [
            ...prevFriendships.slice(0, index),
            friendship,
            ...prevFriendships.slice(index + 1),
          ];

        return sortFriendships(newFriendships);
      });
    },
    [updateFriendships],
  );

  const updateFriendStatus = useCallback(
    function (statusData = new UserActivity({})) {
      const status = new UserActivity(statusData);

      updateFriendships((prevFriendships) => {
        if (!prevFriendships) return prevFriendships;

        const index = prevFriendships.findIndex(
          (friend) => friend.user_id === status.user_id,
        );
        if (index === -1) return prevFriendships;

        const friendship = new UserFriendship({
          ...prevFriendships[index],
          activity: status.activity,
        });

        //if offline, store last_seen value.
        if (status.activity === User.ACTIVITY.OFFLINE)
          friendship.last_seen = status.last_seen;

        const newFriendships = sortFriendships([
          ...prevFriendships.slice(0, index),
          friendship,
          ...prevFriendships.slice(index + 1),
        ]);
        return newFriendships;
      });
    },
    [updateFriendships],
  );

  //specify either properties to identify entry
  const removeFriendship = useCallback(
    function ({ friendship_id = 0, user_id = 0 }) {
      let find = () => false;
      if (friendship_id !== 0)
        //friendship_id is defined, use it for find function
        find = (friend) => friend.id === friendship_id;
      //else use user_id
      else find = (friend) => friend.user_id === user_id;

      updateFriendships((prevFriendships) => {
        if (!prevFriendships) return prevFriendships;

        const index = prevFriendships.findIndex(find);
        if (index === -1) return prevFriendships;

        const newFriendships = [
          ...prevFriendships.slice(0, index),
          ...prevFriendships.slice(index + 1),
        ];
        return newFriendships;
      });
    },
    [updateFriendships],
  );

  useEffect(() => clearSocket, []);

  useEffect(() => {
    function socketChatItemCB(chatItemData = new ChatItemData({})) {
      const chatItem = new ChatItemData(chatItemData);
      if (chatItem.chatId.isGroup) return;

      updateDirectId(chatItem.user_id, chatItem.chatId.id);
    }

    window.socket.on("chat item", socketChatItemCB);

    return () => {
      window.socket.off("chat item", socketChatItemCB);
    };
  }, [updateDirectId]);

  useEffect(() => {
    window.socket.on("update friendship", updateFriendship);
    window.socket.on("friend", updateFriendStatus);
    window.socket.on("unfriend", removeFriendship);
    window.socket.on("delete friend request", removeFriendship);

    return () => {
      window.socket.off("update friendship", updateFriendship);
      window.socket.off("friend", updateFriendStatus);
      window.socket.off("unfriend", removeFriendship);
      window.socket.off("delete friend request", removeFriendship);
    };
  }, [removeFriendship, updateFriendStatus, updateFriendship]);

  if (friendships === undefined) return <Loading name="friendships" />;
  else if (friendships === null) return <LoadFail name="friendships" />;
  else if (friendships === false) return <LoadError name="friendships" />;
  else if (friendships.length === 0) return <p>Friendships is empty.</p>;

  const acceptedRequest = friendships.filter(
    (friendship) => friendship.state === RequestStatus.ACCEPTED,
  );
  const sentRequest = friendships.filter(
    (friendship) =>
      friendship.state === RequestStatus.PENDING && !friendship.is_initiator,
  );
  const receivedRequest = friendships.filter(
    (friendship) =>
      friendship.state === RequestStatus.PENDING && friendship.is_initiator,
  );
  const rejectedRequest = friendships.filter(
    (friendship) =>
      friendship.state === RequestStatus.REJECTED && !friendship.is_initiator,
  );

  return (
    <div className="s-pad">
      <h2>Friendship Panel</h2>
      <p>
        Your friends and pending request is managed here. Go to{" "}
        <Link to={allLinks.userList.href}>user list</Link> to add users.
      </p>
      <UpdateDirectIdContext.Provider value={updateDirectId}>
        {receivedRequest.length > 0 ? (
          <>
            <div className="line"></div>
            <FriendshipSection
              header="Received Request"
              friendships={receivedRequest}
              open
            />
          </>
        ) : null}
        {acceptedRequest.length > 0 ? (
          <>
            <div className="line"></div>
            <FriendshipSection
              header="Friends"
              friendships={acceptedRequest}
              open
            />
          </>
        ) : null}
        {sentRequest.length > 0 ? (
          <>
            <div className="line"></div>
            <FriendshipSection
              header="Sent Request"
              friendships={sentRequest}
            />
          </>
        ) : null}
        {rejectedRequest.length > 0 ? (
          <>
            <div className="line"></div>
            <FriendshipSection
              header="Rejected Request"
              friendships={rejectedRequest}
            />
          </>
        ) : null}
      </UpdateDirectIdContext.Provider>
    </div>
  );
}

export default FriendshipPanel;

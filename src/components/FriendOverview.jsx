import { useEffect, useState, useCallback } from "react";
import FriendList from "./FriendList";
import { UpdateDirectIdContext } from "./FriendButtonBar";
import sortFriends from "../../controllers/sortFriends.js";
import clearSocket from "../../controllers/clearSocket.js";
import {
  ChatItemData,
  User,
  UserFriendship,
  FriendRequest,
  UserActivity,
} from "../../controllers/chat-data.js";

function FriendOverview() {
  //[]: contain instances of UserFriendship - chat-data.js
  const [friends, setFriends] = useState([]);

  const updateDirectId = useCallback(function (user_id, direct_chat_id) {
    setFriends((prevFriends) => {
      const index = prevFriends.findIndex(
        (friend) => friend.user_id === user_id,
      );
      if (index === -1) return prevFriends;

      const friendship = new UserFriendship({
        ...prevFriends[index],
        direct_chat_id,
      });

      const newFriends = [
        ...prevFriends.slice(0, index),
        friendship,
        ...prevFriends.slice(index + 1),
      ];
      return newFriends;
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/friends", { signal: controller.signal });

    fetch(request)
      .then((res) => res.json())
      .then((array) => array.map((friend) => new UserFriendship(friend)))
      .then((array) => setFriends(sortFriends(array)))
      .catch(() => {});

    return () => {
      controller.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, []);

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
    window.socket.on("update friendship", updateFriends);
    window.socket.on("friend", updateFriendStatus);
    window.socket.on("unfriend", removeFriendsEntry);
    window.socket.on("delete friend request", removeFriendsEntry);

    return () => {
      window.socket.off("update friendship", updateFriends);
      window.socket.off("friend", updateFriendStatus);
      window.socket.off("unfriend", removeFriendsEntry);
      window.socket.off("delete friend request", removeFriendsEntry);
    };
  }, []);

  function updateFriends(friendshipData = new UserFriendship({})) {
    const friendship = new UserFriendship(friendshipData);

    setFriends((prevFriends) => {
      const index = prevFriends.findIndex(
        (friend) => friend.id === friendship.id,
      );

      let newFriends;
      if (index === -1)
        //add
        newFriends = [friendship, ...prevFriends];
      //replace
      else
        newFriends = [
          ...prevFriends.slice(0, index),
          friendship,
          ...prevFriends.slice(index + 1),
        ];

      return sortFriends(newFriends);
    });
  }

  function updateFriendStatus(statusData = new UserActivity({})) {
    const status = new UserActivity(statusData);

    setFriends((prevFriends) => {
      const index = prevFriends.findIndex(
        (friend) => friend.user_id === status.user_id,
      );
      if (index === -1) return prevFriends;

      const friendship = new UserFriendship({
        ...prevFriends[index],
        activity: status.activity,
      });

      //if offline, store last_seen value.
      if (status.activity === User.ACTIVITY_TYPE.OFFLINE)
        friendship.last_seen = status.last_seen;

      const newFriends = sortFriends([
        ...prevFriends.slice(0, index),
        friendship,
        ...prevFriends.slice(index + 1),
      ]);
      return newFriends;
    });
  }

  //specify either properties to identify entry
  function removeFriendsEntry({ friendship_id = 0, user_id = 0 }) {
    let find = () => false;
    if (friendship_id !== 0)
      //friendship_id is defined, use it for find function
      find = (friend) => friend.id === friendship_id;
    //else use user_id
    else find = (friend) => friend.user_id === user_id;

    setFriends((prevFriends) => {
      const index = prevFriends.findIndex(find);
      if (index === -1) return prevFriends;

      const newFriends = [
        ...prevFriends.slice(0, index),
        ...prevFriends.slice(index + 1),
      ];
      return newFriends;
    });
  }

  const acceptedRequest = friends.filter(
    (friend) => friend.state === FriendRequest.ACCEPTED,
  );
  const sentRequest = friends.filter(
    (friend) => friend.state === FriendRequest.PENDING && !friend.is_initiator,
  );
  const receivedRequest = friends.filter(
    (friend) => friend.state === FriendRequest.PENDING && friend.is_initiator,
  );
  const rejectedRequest = friends.filter(
    (friend) => friend.state === FriendRequest.REJECTED && !friend.is_initiator,
  );

  return (
    <UpdateDirectIdContext.Provider value={updateDirectId}>
      <div className="friend-overview">
        <h1>Friend Overview</h1>
        {receivedRequest.length > 0 ? (
          <section>
            <h2>Received Request</h2>
            <FriendList friends={receivedRequest} />
          </section>
        ) : null}
        {sentRequest.length > 0 ? (
          <section>
            <h2>Send Request</h2>
            <FriendList friends={sentRequest} />
          </section>
        ) : null}
        {acceptedRequest.length > 0 ? (
          <section>
            <h2>Friends</h2>
            <FriendList friends={acceptedRequest} />
          </section>
        ) : null}
        {rejectedRequest.length > 0 ? (
          <section>
            <h2>Rejected Request</h2>
            <FriendList friends={rejectedRequest} />
          </section>
        ) : null}
      </div>
    </UpdateDirectIdContext.Provider>
  );
}

export default FriendOverview;

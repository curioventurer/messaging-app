import { useEffect, useState } from "react";
import FriendList from "./FriendList";
import { FRIEND_REQUEST_TYPE } from "../controllers/constants.js";
import sortFriends from "../controllers/sortFriends.js";
import clearSocket from "../controllers/clearSocket.js";

function FriendOverview() {
  let [friends, setFriends] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/friends", { signal: controller.signal });

    fetch(request)
      .then((res) => res.json())
      .then((data) => setFriends(data))
      .catch(() => {});

    return () => {
      controller.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, []);

  useEffect(() => {
    window.socket.on("friend request update", updateFriends);

    return () => {
      window.socket.off("friend request update", updateFriends);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearSocket();
    };
  }, []);

  function updateFriends(friendUpdate) {
    setFriends((prevFriends) => {
      const index = prevFriends.findIndex(
        (friend) => friend.id === friendUpdate.id,
      );
      if (index === -1) return prevFriends;

      const newFriends = sortFriends([
        ...prevFriends.slice(0, index),
        {
          ...prevFriends[index],
          state: friendUpdate.state,
          modified: friendUpdate.modified,
        },
        ...prevFriends.slice(index + 1),
      ]);

      return newFriends;
    });
  }

  const acceptedRequest = friends.filter(
    (friend) => friend.state === FRIEND_REQUEST_TYPE.ACCEPTED,
  );
  const sendRequest = friends.filter(
    (friend) =>
      friend.state === FRIEND_REQUEST_TYPE.PENDING && friend.initiator,
  );
  const receivedRequest = friends.filter(
    (friend) =>
      friend.state === FRIEND_REQUEST_TYPE.PENDING && !friend.initiator,
  );
  const rejectedRequest = friends.filter(
    (friend) =>
      friend.state === FRIEND_REQUEST_TYPE.REJECTED && friend.initiator,
  );

  return (
    <div className="friend-overview">
      <h1>Friend Overview</h1>
      {receivedRequest.length > 0 ? (
        <section>
          <h2>Received Request</h2>
          <FriendList friends={receivedRequest} />
        </section>
      ) : null}
      {sendRequest.length > 0 ? (
        <section>
          <h2>Send Request</h2>
          <FriendList friends={sendRequest} />
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
  );
}

export default FriendOverview;

import { useEffect, useState, useRef } from "react";
import FriendList from "./FriendList";
import { FRIEND_REQUEST_TYPE } from "../controllers/constants.js";
import sortFriends from "../controllers/sortFriends.js";
import clearSocket from "../controllers/clearSocket.js";

function FriendOverview() {
  const [friends, setFriends] = useState([]);
  const controllerRef = useRef(new AbortController());

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
    /*If there is a pre-existing entry, state can be updated directly.
      Otherwise, fetch missing information to form an entry, then update.
    */
    function updateFriends(friendship) {
      //find entry from state
      const index = friends.findIndex((friend) => friend.id === friendship.id);

      //update state directly
      if (index !== -1) {
        setFriends((prevFriends) => {
          const index = prevFriends.findIndex(
            (friend) => friend.id === friendship.id,
          );

          friendship.name = prevFriends[index].name;

          const newFriends = sortFriends([
            ...prevFriends.slice(0, index),
            friendship,
            ...prevFriends.slice(index + 1),
          ]);
          return newFriends;
        });
        return;
      }

      //fetch missing information to form entry, then update.
      const request = new Request("/api/user/" + friendship.user_id, {
        signal: controllerRef.current.signal,
      });

      fetch(request)
        .then((res) => res.json())
        .then((data) => {
          setFriends((prevFriends) => {
            friendship.name = data.name;
            return sortFriends([friendship, ...prevFriends]);
          });
        })
        .catch(() => {});
    }

    window.socket.on("update friendship", updateFriends);

    return () => {
      window.socket.off("update friendship", updateFriends);
    };
  }, [friends]);

  useEffect(() => {
    controllerRef.current = new AbortController();

    return () => {
      clearSocket();

      controllerRef.current.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, []);

  const acceptedRequest = friends.filter(
    (friend) => friend.state === FRIEND_REQUEST_TYPE.ACCEPTED,
  );
  const sendRequest = friends.filter(
    (friend) =>
      friend.state === FRIEND_REQUEST_TYPE.PENDING && !friend.is_initiator,
  );
  const receivedRequest = friends.filter(
    (friend) =>
      friend.state === FRIEND_REQUEST_TYPE.PENDING && friend.is_initiator,
  );
  const rejectedRequest = friends.filter(
    (friend) =>
      friend.state === FRIEND_REQUEST_TYPE.REJECTED && !friend.is_initiator,
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

import { useEffect, useState, useRef } from "react";
import FriendList from "./FriendList";
import { UpdateDirectChatIdContext } from "./FriendButtonBar";
import { FRIEND_REQUEST_TYPE } from "../controllers/constants.js";
import sortFriends from "../controllers/sortFriends.js";
import clearSocket from "../controllers/clearSocket.js";
import { ChatItemData } from "../controllers/chat-data.js";

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
            friendship.name = data ? data.name : "default_name";
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

  useEffect(() => {
    function socketChatItemCB(chatItemData = new ChatItemData({})) {
      const chatItem = new ChatItemData(chatItemData);
      if (chatItem.chatId.isGroup) return;

      updateDirectChatId(chatItem.user_id, chatItem.chatId.id);
    }

    window.socket.on("chat item", socketChatItemCB);

    return () => {
      window.socket.off("chat item", socketChatItemCB);
    };
  }, []);

  useEffect(() => {
    window.socket.on("unfriend", removeFriendsEntry);

    return () => {
      window.socket.off("unfriend", removeFriendsEntry);
    };
  }, []);

  function updateDirectChatId(user_id, direct_chat_id) {
    setFriends((prevFriends) => {
      const index = prevFriends.findIndex(
        (friend) => friend.user_id === user_id,
      );
      if (index === -1) return prevFriends;

      const friendship = {
        ...prevFriends[index],
        direct_chat_id,
      };

      const newFriends = [
        ...prevFriends.slice(0, index),
        friendship,
        ...prevFriends.slice(index + 1),
      ];
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
    (friend) => friend.state === FRIEND_REQUEST_TYPE.ACCEPTED,
  );
  const sentRequest = friends.filter(
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
    <UpdateDirectChatIdContext.Provider value={{ updateDirectChatId }}>
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
    </UpdateDirectChatIdContext.Provider>
  );
}

export default FriendOverview;

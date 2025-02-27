import { useEffect, useState, useCallback } from "react";
import UserItem from "./UserItem";
import { UpdateDirectIdContext } from "./FriendButtonBar";
import clearSocket from "../controllers/clearSocket.js";
import { User, UserFriendship, ChatItemData } from "../../js/chat-data.js";

function UserList() {
  const [users, setUsers] = useState([]);

  const updateDirectId = useCallback(function (user_id, direct_chat_id) {
    setUsers((prevUsers) => {
      const index = prevUsers.findIndex((user) => user.id === user_id);
      if (index === -1) return prevUsers;

      const user = prevUsers[index];

      const friendship = new UserFriendship({
        ...user.friendship,
        direct_chat_id,
      });

      const updatedUser = new User({
        ...user.toJSON(),
        friendship,
      });

      const newUsers = [
        ...prevUsers.slice(0, index),
        updatedUser,
        ...prevUsers.slice(index + 1),
      ];
      return newUsers;
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/users", { signal: controller.signal });

    fetch(request)
      .then((res) => res.json())
      .then((arr) => setUsers(arr.map((user) => new User(user))))
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
    window.socket.on("add user", addUser);
    window.socket.on("update friendship", updateFriendship);
    window.socket.on("unfriend", clearFriendship);
    window.socket.on("delete friend request", clearFriendship);

    return () => {
      window.socket.off("add user", addUser);
      window.socket.off("update friendship", updateFriendship);
      window.socket.off("unfriend", clearFriendship);
      window.socket.off("delete friend request", clearFriendship);
    };
  }, []);

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

  useEffect(() => clearSocket, []);

  function addUser(userData = new User({})) {
    const newUser = new User(userData);

    setUsers((prevUsers) => {
      const index = prevUsers.findIndex((user) => user.id === newUser.id);
      if (index !== -1) return prevUsers;

      const newUsers = User.sortUsers([...prevUsers, newUser]);

      return newUsers;
    });
  }

  function updateFriendship(friendshipData = new UserFriendship({})) {
    const friendship = new UserFriendship(friendshipData);

    setUsers((prevUsers) => {
      const index = prevUsers.findIndex(
        (user) => user.id === friendship.user_id,
      );
      if (index === -1) return prevUsers;

      const updatedUser = new User({
        ...prevUsers[index].toJSON(),
        friendship,
      });

      const newUsers = [
        ...prevUsers.slice(0, index),
        updatedUser,
        ...prevUsers.slice(index + 1),
      ];

      return newUsers;
    });
  }

  /*Reset friendship prop to default values, to indicate removal of the record.
    Accepts either parameters for find.
  */
  function clearFriendship({ friendship_id = 0, user_id = 0 }) {
    //Determine find function to use, based on provided parameters.
    let find = () => false;
    if (user_id !== 0) find = (user) => user.id === user_id;
    else find = (user) => user.friendship.id === friendship_id;

    setUsers((prevUsers) => {
      const index = prevUsers.findIndex(find);
      if (index === -1) return prevUsers;

      const user = prevUsers[index];

      const friendship = new UserFriendship(user.friendship);
      friendship.setDefaults();

      const updatedUser = new User({
        ...user.toJSON(),
        friendship,
      });

      const newUsers = [
        ...prevUsers.slice(0, index),
        updatedUser,
        ...prevUsers.slice(index + 1),
      ];

      return newUsers;
    });
  }

  return (
    <div className="user-list-page">
      <h1>Users</h1>
      <p>
        You can add friends from the list of users. But you will have to wait
        for them to accept your request. Your can check your pending request in
        friend page.
      </p>
      <UpdateDirectIdContext.Provider value={updateDirectId}>
        <table className="user-list">
          <tbody>
            {users.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </UpdateDirectIdContext.Provider>
    </div>
  );
}

export default UserList;

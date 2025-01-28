import { useEffect, useState } from "react";
import UserItem from "./UserItem";
import { UpdateDirectChatIdContext } from "./FriendButtonBar.jsx";
import clearSocket from "../controllers/clearSocket.js";
import sortUsers from "../controllers/sortUsers.js";
import { UserFriendship, ChatItemData } from "../controllers/chat-data.js";

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/users", { signal: controller.signal });

    fetch(request)
      .then((res) => res.json())
      .then((arr) =>
        setUsers(
          arr.map((user) => {
            return {
              ...user,
              friendship: new UserFriendship(user.friendship),
            };
          }),
        ),
      )
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

      updateDirectChatId(chatItem.user_id, chatItem.chatId.id);
    }

    window.socket.on("chat item", socketChatItemCB);

    return () => {
      window.socket.off("chat item", socketChatItemCB);
    };
  }, []);

  useEffect(() => clearSocket, []);

  function addUser(newUser) {
    setUsers((prevUsers) => {
      const index = prevUsers.findIndex((user) => user.id === newUser.id);
      if (index !== -1) return prevUsers;

      const newUsers = sortUsers([...prevUsers, newUser]);

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

      const updatedUser = {
        ...prevUsers[index],
        friendship,
      };

      const newUsers = [
        ...prevUsers.slice(0, index),
        updatedUser,
        ...prevUsers.slice(index + 1),
      ];

      return newUsers;
    });
  }

  //reset friendship prop to default values, to indicate removal of the record.
  function clearFriendship({ friendship_id = 0, user_id = 0 }) {
    let find = () => false;
    if (user_id !== 0) find = (user) => user.id === user_id;
    else find = (user) => user.friendship.id === friendship_id;

    setUsers((prevUsers) => {
      const index = prevUsers.findIndex(find);
      if (index === -1) return prevUsers;

      const user = prevUsers[index];

      const friendship = new UserFriendship({
        user_id: user.id,
        name: user.name,
      });

      const updatedUser = {
        ...user,
        friendship,
      };

      const newUsers = [
        ...prevUsers.slice(0, index),
        updatedUser,
        ...prevUsers.slice(index + 1),
      ];

      return newUsers;
    });
  }

  function updateDirectChatId(user_id, direct_chat_id) {
    setUsers((prevUsers) => {
      const index = prevUsers.findIndex((user) => user.id === user_id);
      if (index === -1) return prevUsers;

      const user = prevUsers[index];

      const friendship = new UserFriendship({
        ...user.friendship,
        direct_chat_id,
      });

      const updatedUser = {
        ...user,
        friendship,
      };

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
      <UpdateDirectChatIdContext.Provider value={{ updateDirectChatId }}>
        <table className="user-list">
          <tbody>
            {users.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </UpdateDirectChatIdContext.Provider>
    </div>
  );
}

export default UserList;

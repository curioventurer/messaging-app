import { useEffect, useState } from "react";
import UserItem from "./UserItem";
import clearSocket from "../controllers/clearSocket.js";

function UserList() {
  let [users, setUsers] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/users", { signal: controller.signal });

    fetch(request)
      .then((res) => res.json())
      .then((data) => setUsers(data))
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
    window.socket.on("update friendship", updateFriendship);

    return () => {
      window.socket.off("update friendship", updateFriendship);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearSocket();
    };
  }, []);

  function updateFriendship(friendship) {
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

  return (
    <>
      <h1>Users</h1>
      <p>
        You can add friends from the list of users. But you will have to wait
        for them to accept your request. Your can check your pending request in
        friend page.
      </p>
      <ul className="user-list">
        {users.map((user) => (
          <li key={user.id}>
            <UserItem user={user} />
          </li>
        ))}
      </ul>
    </>
  );
}

export default UserList;

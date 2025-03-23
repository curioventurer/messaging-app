import { useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import useFetchedState from "../../hooks/useFetchedState.jsx";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import UserItem from "./UserItem.jsx";
import { socket } from "../../controllers/socket.js";
import { allLinks } from "../../controllers/constant.js";
import { clearSocket } from "../../controllers/socket.js";
import { User, UserFriendship } from "../../../js/chat-data.js";

function UserList() {
  const parseUsers = useCallback(function (array, setUsers) {
    if (array === false) return setUsers(array);

    setUsers(array.map((user) => new User(user)));
  }, []);

  //contain instances of User - chat-data.js
  const [users, setUsers] = useFetchedState({
    callback: parseUsers,
    path: "/api/user-list",
  });

  const addUser = useCallback(
    function (userData = new User({})) {
      const newUser = new User(userData);

      setUsers((prevUsers) => {
        if (!prevUsers) return prevUsers;

        const index = prevUsers.findIndex((user) => user.id === newUser.id);
        if (index !== -1) return prevUsers;

        const newUsers = User.sortUsers([...prevUsers, newUser]);

        return newUsers;
      });
    },
    [setUsers],
  );

  const deleteUser = useCallback(
    function ({ user_id }) {
      setUsers((prevUsers) => {
        if (!prevUsers) return prevUsers;

        const index = prevUsers.findIndex((user) => user.id === user_id);
        if (index === -1) return prevUsers;

        const newUsers = [
          ...prevUsers.slice(0, index),
          ...prevUsers.slice(index + 1),
        ];

        return newUsers;
      });
    },
    [setUsers],
  );

  const updateFriendship = useCallback(
    function (friendshipData = new UserFriendship({})) {
      const friendship = new UserFriendship(friendshipData);

      setUsers((prevUsers) => {
        if (!prevUsers) return prevUsers;

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
    },
    [setUsers],
  );

  //Reset friendship prop to default values, to indicate removal of the record.
  const deleteFriendship = useCallback(
    function ({ user_id }) {
      setUsers((prevUsers) => {
        if (!prevUsers) return prevUsers;

        const index = prevUsers.findIndex((user) => user.id === user_id);
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
    },
    [setUsers],
  );

  const updateDirectId = useCallback(
    function ({ user_id, direct_chat_id }) {
      setUsers((prevUsers) => {
        if (!prevUsers) return prevUsers;

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
    },
    [setUsers],
  );

  useEffect(() => {
    socket.on("add user", addUser);
    socket.on("deleteUser", deleteUser);
    socket.on("updateDirectId", updateDirectId);
    socket.on("update friendship", updateFriendship);
    socket.on("deleteFriendship", deleteFriendship);

    return () => {
      socket.off("add user", addUser);
      socket.off("deleteUser", deleteUser);
      socket.off("updateDirectId", updateDirectId);
      socket.off("update friendship", updateFriendship);
      socket.off("deleteFriendship", deleteFriendship);
    };
  }, [addUser, deleteUser, updateDirectId, updateFriendship, deleteFriendship]);

  useEffect(() => clearSocket, []);

  let content;

  if (users === undefined) content = <Loading name="user list" />;
  else if (users === null) content = <LoadFail name="user list" />;
  else if (users === false) content = <LoadError name="user list" />;
  else if (users.length === 0) content = <p>User list is empty.</p>;
  else
    content = (
      <table className="list-table user">
        <tbody>
          {users.map((user) => (
            <UserItem key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    );

  return (
    <div className="list-page">
      <h1>User List</h1>
      <p>
        You can add friends from the list of users. Once added, you will have to
        wait for them to accept your request. You can check all your pending
        request at{" "}
        <Link to={allLinks.home.search.friend.href}>friend panel</Link> in home
        page.
      </p>
      <nav className="s-block-margin">
        <ul className="button-bar">
          <li>
            <Link
              to={allLinks.home.search.friend.href}
              className={"button-link"}
            >
              Friend Panel
            </Link>
          </li>
        </ul>
      </nav>
      {content}
    </div>
  );
}

export default UserList;

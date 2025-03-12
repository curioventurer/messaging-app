import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import GroupItem from "./GroupItem.jsx";
import clearSocket from "../../controllers/clearSocket.js";
import { allLinks } from "../../controllers/constant.js";
import { Group } from "../../../js/chat-data.js";

function GroupList() {
  //contain instances of Group - chat-data.js
  const [groups, setGroups] = useState(undefined);

  const parseGroups = useCallback(function (array) {
    if (array === false) return setGroups(array);

    setGroups(array.map((group) => new Group(group)));
  }, []);

  const isExpired = useFetch({ callback: parseGroups, path: "/api/groups" });

  /*If fetch timeouts(expires), set state to null to indicate fetch failure.
    Else, initialize state to undefined to indicate fetch in progress.
  */
  useEffect(() => {
    if (isExpired) setGroups(null);
    else setGroups(undefined);
  }, [isExpired]);

  useEffect(() => {
    window.socket.on("add group", addGroup);

    return () => {
      window.socket.off("add group", addGroup);
    };
  }, []);

  useEffect(() => clearSocket, []);

  function addGroup(groupData = new Group({})) {
    const newGroup = new Group(groupData);

    setGroups((prevGroups) => {
      if (!prevGroups) return prevGroups;

      const index = prevGroups.findIndex((group) => group.id === newGroup.id);
      if (index !== -1) return prevGroups;

      const newGroups = Group.sortGroups([...prevGroups, newGroup]);

      return newGroups;
    });
  }

  let content;

  if (groups === undefined) content = <Loading name="group list" />;
  else if (groups === null) content = <LoadFail name="group list" />;
  else if (groups === false) content = <LoadError name="group list" />;
  else if (groups.length === 0) content = <p>Group list is empty.</p>;
  else
    content = (
      <table className="list-table group">
        <tbody>
          {groups.map((group) => (
            <GroupItem key={group.id} group={group} />
          ))}
        </tbody>
      </table>
    );

  return (
    <div className="list-page">
      <h1>Group List</h1>
      <p>
        You can apply to join a group from the list of groups. After
        application, you will have to wait for the group owner or admin to
        accept your request. You can check all your pending applications in{" "}
        <Link to={allLinks.home.search.groups.href}>home</Link> page.
      </p>
      {content}
    </div>
  );
}

export default GroupList;

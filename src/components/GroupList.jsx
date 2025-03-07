import { useEffect, useState, useCallback } from "react";
import useFetch from "../hooks/useFetch";
import Loading from "./Loading";
import LoadFail from "./LoadFail";
import LoadError from "./LoadError";
import GroupItem from "./GroupItem";
import clearSocket from "../controllers/clearSocket.js";
import { Group } from "../../js/chat-data.js";

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
      <table className="list-table">
        <tbody>
          {groups.map((group) => (
            <GroupItem key={group.id} group={group} />
          ))}
        </tbody>
      </table>
    );

  return (
    <div className="list-page group-list">
      <h1>Groups</h1>
      <p>List of groups.</p>
      {content}
    </div>
  );
}

export default GroupList;

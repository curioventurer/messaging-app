import { useEffect, useState } from "react";
import GroupItem from "./GroupItem";
import sortGroups from "../controllers/sortGroups.js";

function GroupList() {
  let [groups, setGroups] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/groups", { signal: controller.signal });

    fetch(request)
      .then((res) => res.json())
      .then((data) => setGroups(sortGroups(data)))
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
    window.socket.on("message", updateLastMsg);

    return () => {
      window.socket.off("message", updateLastMsg);
    };
  }, []);

  function updateLastMsg(message) {
    setGroups((prevGroups) => {
      const index = prevGroups.findIndex(
        (group) => group.id === message.group_id,
      );
      if (index === -1) return prevGroups;

      const updatedGroup = { ...prevGroups[index], lastMessage: message };
      const newGroups = sortGroups([
        updatedGroup,
        ...prevGroups.slice(0, index),
        ...prevGroups.slice(index + 1),
      ]);

      return newGroups;
    });
  }

  return (
    <ul className="group-list room-left-screen">
      {groups.map((group) => (
        <li key={group.id}>
          <GroupItem group={group} />
        </li>
      ))}
    </ul>
  );
}

export default GroupList;

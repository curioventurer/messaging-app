import { useEffect, useState } from "react";
import GroupItem from "./GroupItem";

function GroupList() {
  let [groups, setgroups] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/groups", { signal: controller.signal });

    fetch(request)
      .then((res) => res.json())
      .then((data) => setgroups(data))
      .catch(() => {});

    return () => {
      controller.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, []);

  return (
    <ul className="group-list left-screen">
      {groups.map((group) => (
        <li key={group.id}>
          <GroupItem group={group} />
        </li>
      ))}
    </ul>
  );
}

export default GroupList;

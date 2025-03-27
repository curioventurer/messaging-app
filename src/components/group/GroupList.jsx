import { useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import useFetchedState from "../../hooks/useFetchedState.jsx";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import GroupTable from "./GroupTable.jsx";
import { socket } from "../../controllers/socket.js";
import { clearSocket } from "../../controllers/socket.js";
import { allLinks } from "../../controllers/constant.js";
import { Group, Member } from "../../../js/chat-data.js";

function GroupList() {
  const parseGroupList = useCallback(function (array, setGroupList) {
    if (array === false) return setGroupList(false);

    setGroupList(array.map((group) => new Group(group)));
  }, []);

  //contain instances of Group - chat-data.js
  const [groupList, setGroupList] = useFetchedState({
    callback: parseGroupList,
    path: "/api/group-list",
  });

  const addGroup = useCallback(
    function (groupData = new Group({})) {
      const newGroup = new Group(groupData);

      setGroupList((prevGroupList) => {
        if (!prevGroupList) return prevGroupList;

        const index = prevGroupList.findIndex(
          (group) => group.id === newGroup.id,
        );
        if (index !== -1) return prevGroupList;

        const newGroupList = Group.sortGroups([...prevGroupList, newGroup]);

        return newGroupList;
      });
    },
    [setGroupList],
  );

  const deleteGroup = useCallback(
    function ({ group_id }) {
      setGroupList((prevGroupList) => {
        if (!prevGroupList) return prevGroupList;

        const index = prevGroupList.findIndex((group) => group.id === group_id);
        if (index === -1) return prevGroupList;

        const newGroupList = [
          ...prevGroupList.slice(0, index),
          ...prevGroupList.slice(index + 1),
        ];

        return newGroupList;
      });
    },
    [setGroupList],
  );

  const updateMembership = useCallback(
    function (membershipData = new Member({})) {
      const newMembership = new Member(membershipData);

      setGroupList((prevGroupList) => {
        if (!prevGroupList) return prevGroupList;

        const index = prevGroupList.findIndex(
          (group) => group.id === newMembership.group_id,
        );
        if (index === -1) return prevGroupList;

        const newGroup = new Group({
          ...prevGroupList[index].toJSON(),
          membership: newMembership,
        });

        const newGroupList = [
          ...prevGroupList.slice(0, index),
          newGroup,
          ...prevGroupList.slice(index + 1),
        ];

        return newGroupList;
      });
    },
    [setGroupList],
  );

  const deleteMembership = useCallback(
    function ({ group_id }) {
      setGroupList((prevGroupList) => {
        if (!prevGroupList) return prevGroupList;

        const index = prevGroupList.findIndex((group) => group.id === group_id);
        if (index === -1) return prevGroupList;

        //replace membership with default value
        const newGroup = new Group({
          ...prevGroupList[index].toJSON(),
          membership: new Member({}),
        });

        const newGroupList = [
          ...prevGroupList.slice(0, index),
          newGroup,
          ...prevGroupList.slice(index + 1),
        ];

        return newGroupList;
      });
    },
    [setGroupList],
  );

  useEffect(() => {
    socket.on("addGroup", addGroup);
    socket.on("deleteGroup", deleteGroup);
    socket.on("updateMembership", updateMembership);
    socket.on("deleteMembership", deleteMembership);

    return () => {
      socket.off("addGroup", addGroup);
      socket.off("deleteGroup", deleteGroup);
      socket.off("updateMembership", updateMembership);
      socket.off("deleteMembership", deleteMembership);
    };
  }, [addGroup, deleteGroup, updateMembership, deleteMembership]);

  useEffect(() => clearSocket, []);

  let content;

  if (groupList === undefined) content = <Loading name="group list" />;
  else if (groupList === null) content = <LoadFail name="group list" />;
  else if (groupList === false) content = <LoadError name="group list" />;
  else if (groupList.length === 0) content = <p>Group list is empty.</p>;
  else {
    const reservedGroups = groupList.filter((group) => group.is_reserved);
    const userGroups = groupList.filter((group) => !group.is_reserved);

    content = (
      <>
        <section>
          <h2>Default Groups</h2>
          <GroupTable groupList={reservedGroups} />
        </section>
        <section>
          <h2>User Groups</h2>
          <GroupTable groupList={userGroups} />
        </section>
      </>
    );
  }

  return (
    <div className="list-page">
      <h1>Group List</h1>
      <p>
        You can directly join public groups while private groups require you to
        apply. After application, you will have to wait for the group owner or
        admin to accept your request. You can check all your pending
        applications at{" "}
        <Link to={allLinks.home.search.group.href}>group panel</Link> in home
        page.
      </p>
      <nav className="s-block-margin">
        <ul className="button-bar">
          <li>
            <Link
              to={allLinks.home.search.group.href}
              className={"button-link"}
            >
              Group Panel
            </Link>
          </li>
          <li>
            <Link to={allLinks.createGroup.href} className={"button-link"}>
              {allLinks.createGroup.name}
            </Link>
          </li>
        </ul>
      </nav>
      {content}
    </div>
  );
}

export default GroupList;

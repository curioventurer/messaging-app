import { useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import useFetchedState from "../../hooks/useFetchedState.jsx";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import GroupItem from "./GroupItem.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import clearSocket from "../../controllers/clearSocket.js";
import { allLinks } from "../../controllers/constant.js";
import { Group, Member } from "../../../js/chat-data.js";

function GroupList() {
  const { client } = useContext(InterfaceContext);

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

  const updateGroup = useCallback(
    function (groupData = new Group({})) {
      const newGroup = new Group(groupData);

      //Not an update for user, return.
      if (newGroup.membership.user_id !== client.id) return;

      setGroupList((prevGroupList) => {
        if (!prevGroupList) return prevGroupList;

        const index = prevGroupList.findIndex(
          (group) => group.id === newGroup.id,
        );
        if (index === -1) return prevGroupList;

        const newGroupList = [
          ...prevGroupList.slice(0, index),
          newGroup,
          ...prevGroupList.slice(index + 1),
        ];

        return newGroupList;
      });
    },
    [client.id, setGroupList],
  );

  const deleteMembership = useCallback(
    function (membershipData = new Member({})) {
      const membership = new Member(membershipData);

      //Not an update for user, return.
      if (membership.user_id !== client.id) return;

      setGroupList((prevGroupList) => {
        if (!prevGroupList) return prevGroupList;

        const index = prevGroupList.findIndex(
          (group) => group.id === membership.group_id,
        );
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
    [client.id, setGroupList],
  );

  useEffect(() => {
    window.socket.on("add group", addGroup);
    window.socket.on("updateMembership", updateGroup);
    window.socket.on("deleteMembership", deleteMembership);

    return () => {
      window.socket.off("add group", addGroup);
      window.socket.off("updateMembership", updateGroup);
      window.socket.off("deleteMembership", deleteMembership);
    };
  }, [addGroup, updateGroup, deleteMembership]);

  useEffect(() => clearSocket, []);

  let content;

  if (groupList === undefined) content = <Loading name="group list" />;
  else if (groupList === null) content = <LoadFail name="group list" />;
  else if (groupList === false) content = <LoadError name="group list" />;
  else if (groupList.length === 0) content = <p>Group list is empty.</p>;
  else
    content = (
      <table className="list-table group">
        <tbody>
          {groupList.map((group) => (
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
        <Link to={allLinks.home.search.group.href}>group</Link> tab of home
        page.
      </p>
      {content}
    </div>
  );
}

export default GroupList;

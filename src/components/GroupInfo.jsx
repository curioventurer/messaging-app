import { useContext } from "react";
import { GroupContext } from "./Room.jsx";
import MemberItem from "./MemberItem.jsx";

function GroupInfo() {
  const { groupData, toggleGroupInfo } = useContext(GroupContext);

  return (
    <div className="group-info left-screen">
      <div className="group-info-header">
        <p>Group Info</p>
        <button onClick={toggleGroupInfo}>&#x2A2F;</button>
      </div>
      <hr></hr>
      <p>Members</p>
      <ul className="member-list">
        {groupData.members.map((member) => (
          <li key={member.id}>
            <MemberItem member={member} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GroupInfo;

import { useContext } from "react";
import { ChatContext } from "./Room.jsx";
import MemberItem from "./MemberItem.jsx";

function GroupInfo() {
  const { chatData, toggleChatInfo } = useContext(ChatContext);

  return (
    <div className="group-info room-left-screen">
      <div className="group-info-header">
        <p>Group Info</p>
        <button onClick={toggleChatInfo}>&#x2A2F;</button>
      </div>
      <section className="member">
        <p>Members</p>
        <ul className="member-list">
          {chatData.members.map((member) => (
            <li key={member.id}>
              <MemberItem member={member} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default GroupInfo;

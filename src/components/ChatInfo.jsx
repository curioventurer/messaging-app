import { useContext } from "react";
import { ChatContext } from "./ChatRoom.jsx";
import MemberItem from "./MemberItem";

function ChatInfo() {
  const { chatData, toggleChatInfo } = useContext(ChatContext);

  return (
    <div className="chat-desc left-screen">
      <div className="chat-info-header">
        <p>Chat Info</p>
        <button onClick={toggleChatInfo}>&#x2A2F;</button>
      </div>
      <hr></hr>
      <p>Members</p>
      <ul className="member-list">
        {chatData.members.map((member) => (
          <li key={member.id}>
            <MemberItem member={member} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChatInfo;

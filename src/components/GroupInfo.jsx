import { useContext } from "react";
import MemberItem from "./MemberItem.jsx";
import { ChatContext } from "./Room.jsx";
import DateFormat from "../controllers/DateFormat.js";

function GroupInfo() {
  const { chatData } = useContext(ChatContext);

  return (
    <>
      <p className="group-create-date">
        {"Created on "}
        <time dateTime={chatData.group.created}>
          {DateFormat.timestamp(chatData.group.created)}
        </time>
      </p>
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
    </>
  );
}

export default GroupInfo;

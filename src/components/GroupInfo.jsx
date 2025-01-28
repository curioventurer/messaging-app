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
        <table className="member-list">
          <tbody>
            {chatData.members.map((member) => (
              <MemberItem key={member.id} member={member} />
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export default GroupInfo;

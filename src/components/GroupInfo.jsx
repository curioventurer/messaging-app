import { useContext } from "react";
import Loading from "./Loading";
import LoadFail from "./LoadFail";
import MemberItem from "./MemberItem";
import { ChatContext } from "./Room";
import DateFormat from "../controllers/DateFormat.js";

function GroupInfo() {
  const { chatData } = useContext(ChatContext);

  if (chatData === undefined) return <Loading name="group info" />;
  else if (chatData === null) return <LoadFail name="group info" />;

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

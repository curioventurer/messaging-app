import { useContext } from "react";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import MemberItem from "./MemberItem";
import PendingMemberItem from "./PendingMemberItem.jsx";
import { RoomContext } from "./Room";
import DateFormat from "../../controllers/DateFormat.js";
import { Member, RequestStatus } from "../../../js/chat-data.js";

function GroupInfo() {
  const { client, room, members } = useContext(RoomContext);

  if (room === undefined) return <Loading name="group info" />;
  else if (room === null) return <LoadFail name="group info" />;
  else if (room === false) return <LoadError name="group info" />;

  const acceptedRequest = Member.filterByState(
    members,
    RequestStatus.ACCEPTED,
    client.id,
  );
  const pendingRequest = Member.filterByState(members, RequestStatus.PENDING);

  return (
    <>
      <p>
        {`Group "${room.name}" was created on `}
        <time dateTime={room.created}>
          {DateFormat.timestamp(room.created)}
        </time>
        {"."}
      </p>
      {pendingRequest.length > 0 ? (
        <section className="pending-member-list">
          <h3>Pending Request</h3>
          <table className="list-table">
            <tbody>
              {pendingRequest.map((member) => (
                <PendingMemberItem key={member.id} member={member} />
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
      <section className="member-list">
        <h3>Members</h3>
        <table className="list-table">
          <tbody>
            {acceptedRequest.map((member) => (
              <MemberItem key={member.id} member={member} />
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export default GroupInfo;

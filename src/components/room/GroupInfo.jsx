import { useContext } from "react";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import MemberItem from "./MemberItem";
import PendingMemberItem from "./PendingMemberItem.jsx";
import RejectedMemberItem from "./RejectedMemberItem.jsx";
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
  const rejectedRequest = Member.filterByState(members, RequestStatus.REJECTED);

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
          <details>
            <summary>
              <h3>Pending Request ({pendingRequest.length})</h3>
            </summary>
            <table className="list-table">
              <tbody>
                {pendingRequest.map((member) => (
                  <PendingMemberItem key={member.id} member={member} />
                ))}
              </tbody>
            </table>
          </details>
        </section>
      ) : null}
      <section className="member-list">
        <details>
          <summary>
            <h3>Members ({acceptedRequest.length})</h3>
          </summary>
          <table className="list-table">
            <tbody>
              {acceptedRequest.map((member) => (
                <MemberItem key={member.id} member={member} />
              ))}
            </tbody>
          </table>
        </details>
      </section>
      {rejectedRequest.length > 0 ? (
        <section className="rejected-member-list">
          <details>
            <summary>
              <h3>Rejected Request ({rejectedRequest.length})</h3>
            </summary>
            <table className="list-table">
              <tbody>
                {rejectedRequest.map((member) => (
                  <RejectedMemberItem key={member.id} member={member} />
                ))}
              </tbody>
            </table>
          </details>
        </section>
      ) : null}
    </>
  );
}

export default GroupInfo;

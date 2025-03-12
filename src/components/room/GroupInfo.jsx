import { useContext } from "react";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import MemberItem from "./MemberItem";
import AppliedMemberItem from "./AppliedMemberItem.jsx";
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
        <section>
          <details open>
            <summary>
              <h3>Pending Request ({pendingRequest.length})</h3>
            </summary>
            <table className="list-table member">
              <tbody>
                {pendingRequest.map((member) => (
                  <AppliedMemberItem key={member.id} member={member} />
                ))}
              </tbody>
            </table>
          </details>
        </section>
      ) : null}
      <>
        <div className="line"></div>
        <section className="member-list">
          <details>
            <summary>
              <h3>Members ({acceptedRequest.length})</h3>
            </summary>
            <table className="list-table member">
              <tbody>
                {acceptedRequest.map((member) => (
                  <MemberItem key={member.id} member={member} />
                ))}
              </tbody>
            </table>
          </details>
        </section>
      </>
      {rejectedRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <section>
            <details>
              <summary>
                <h3>Rejected Request ({rejectedRequest.length})</h3>
              </summary>
              <table className="list-table member">
                <tbody>
                  {rejectedRequest.map((member) => (
                    <AppliedMemberItem key={member.id} member={member} />
                  ))}
                </tbody>
              </table>
            </details>
          </section>
        </>
      ) : null}
    </>
  );
}

export default GroupInfo;

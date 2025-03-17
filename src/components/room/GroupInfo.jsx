import { useContext } from "react";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import MemberSection from "./MemberSection.jsx";
import { RoomContext } from "./Room.jsx";
import DateFormat from "../../controllers/DateFormat.js";
import { Member, RequestStatus } from "../../../js/chat-data.js";

function GroupInfo() {
  const { client, room, memberList } = useContext(RoomContext);

  if (room === undefined) return <Loading name="group info" />;
  else if (room === null) return <LoadFail name="group info" />;
  else if (room === false) return <LoadError name="group info" />;

  const acceptedRequest = Member.filterByState(
    memberList,
    RequestStatus.ACCEPTED,
    client.id,
  );
  const pendingRequest = Member.filterByState(
    memberList,
    RequestStatus.PENDING,
  );
  const rejectedRequest = Member.filterByState(
    memberList,
    RequestStatus.REJECTED,
  );

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
        <>
          <div className="line"></div>
          <MemberSection
            header="Pending Request"
            memberList={pendingRequest}
            open
            request
          />
        </>
      ) : null}
      <div className="line"></div>
      <MemberSection
        header="Members"
        memberList={acceptedRequest}
        className="member-list"
      />
      {rejectedRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <MemberSection
            header="Rejected Request"
            memberList={rejectedRequest}
            request
          />
        </>
      ) : null}
    </>
  );
}

export default GroupInfo;

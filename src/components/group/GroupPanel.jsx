import { useContext } from "react";
import { Link } from "react-router-dom";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import GroupSection from "./GroupSection.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import { allLinks } from "../../controllers/constant.js";
import { RequestStatus } from "../../../js/chat-data.js";

function GroupPanel() {
  const { memberships } = useContext(InterfaceContext);

  if (memberships === undefined) return <Loading name="memberships" />;
  else if (memberships === null) return <LoadFail name="memberships" />;
  else if (memberships === false) return <LoadError name="memberships" />;
  else if (memberships.length === 0) return <p>memberships is empty.</p>;

  const pendingRequest = memberships.filter(
    (group) => group.membership.state === RequestStatus.PENDING,
  );
  const acceptedRequest = memberships.filter(
    (group) => group.membership.state === RequestStatus.ACCEPTED,
  );
  const rejectedRequest = memberships.filter(
    (group) => group.membership.state === RequestStatus.REJECTED,
  );

  return (
    <div className="s-pad">
      <h2>Group Panel</h2>
      <p>
        Groups you joined or applied to is managed here. Go to{" "}
        <Link to={allLinks.groupList.href}>group list</Link> to apply to groups.
      </p>
      {acceptedRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <GroupSection header="Groups" groups={acceptedRequest} open />
        </>
      ) : null}
      {pendingRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <GroupSection header="Pending Request" groups={pendingRequest} />
        </>
      ) : null}
      {rejectedRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <GroupSection header="Rejected Request" groups={rejectedRequest} />
        </>
      ) : null}
    </div>
  );
}

export default GroupPanel;

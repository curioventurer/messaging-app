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
  const { groupList } = useContext(InterfaceContext);

  if (groupList === undefined) return <Loading name="group panel" />;
  else if (groupList === null) return <LoadFail name="group panel" />;
  else if (groupList === false) return <LoadError name="group panel" />;
  else if (groupList.length === 0) return <p>group panel is empty.</p>;

  const pendingRequest = groupList.filter(
    (group) => group.membership.state === RequestStatus.PENDING,
  );
  const acceptedRequest = groupList.filter(
    (group) => group.membership.state === RequestStatus.ACCEPTED,
  );
  const rejectedRequest = groupList.filter(
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
          <GroupSection header="Groups" groupList={acceptedRequest} open />
        </>
      ) : null}
      {pendingRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <GroupSection header="Pending Request" groupList={pendingRequest} />
        </>
      ) : null}
      {rejectedRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <GroupSection header="Rejected Request" groupList={rejectedRequest} />
        </>
      ) : null}
    </div>
  );
}

export default GroupPanel;

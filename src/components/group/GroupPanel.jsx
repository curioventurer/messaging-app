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

  const defaultGroups = groupList.filter((group) => group.is_reserved);
  const userGroups = groupList.filter(
    (group) =>
      !group.is_reserved && group.membership.state === RequestStatus.ACCEPTED,
  );
  const pendingRequest = groupList.filter(
    (group) => group.membership.state === RequestStatus.PENDING,
  );
  const rejectedRequest = groupList.filter(
    (group) => group.membership.state === RequestStatus.REJECTED,
  );

  return (
    <div className="s-pad">
      <h2>Group Panel</h2>
      <p>Groups you joined or applied to is managed here.</p>
      <nav className="s-block-margin">
        <ul className="button-bar">
          <li>
            <Link to={allLinks.groupList.href} className={"button-link"}>
              {allLinks.groupList.name}
            </Link>
          </li>
          <li>
            <Link to={allLinks.createGroup.href} className={"button-link"}>
              {allLinks.createGroup.name}
            </Link>
          </li>
        </ul>
      </nav>
      {defaultGroups.length > 0 ? (
        <>
          <div className="line"></div>
          <GroupSection
            header="Default Groups"
            groupList={defaultGroups}
            open
          />
        </>
      ) : null}
      {userGroups.length > 0 ? (
        <>
          <div className="line"></div>
          <GroupSection header="User Groups" groupList={userGroups} open />
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

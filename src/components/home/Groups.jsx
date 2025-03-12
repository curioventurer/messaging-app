import { useContext } from "react";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import GroupItem from "../group/GroupItem.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import { RequestStatus } from "../../../js/chat-data.js";

function Groups() {
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
      <h2>Groups Panel</h2>
      <p>Groups you joined or applied to is managed here.</p>
      {pendingRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <section>
            <details open>
              <summary>
                <h3>Pending Request ({pendingRequest.length})</h3>
              </summary>
              <table className="list-table group">
                <tbody>
                  {pendingRequest.map((group) => (
                    <GroupItem key={group.id} group={group} />
                  ))}
                </tbody>
              </table>
            </details>
          </section>
        </>
      ) : null}
      {acceptedRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <section>
            <details open>
              <summary>
                <h3>Groups ({acceptedRequest.length})</h3>
              </summary>
              <table className="list-table group">
                <tbody>
                  {acceptedRequest.map((group) => (
                    <GroupItem key={group.id} group={group} />
                  ))}
                </tbody>
              </table>
            </details>
          </section>
        </>
      ) : null}
      {rejectedRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <section>
            <details>
              <summary>
                <h3>Rejected Request ({rejectedRequest.length})</h3>
              </summary>
              <table className="list-table group">
                <tbody>
                  {rejectedRequest.map((group) => (
                    <GroupItem key={group.id} group={group} />
                  ))}
                </tbody>
              </table>
            </details>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default Groups;

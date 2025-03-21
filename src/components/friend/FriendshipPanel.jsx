import { useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import FriendshipSection from "./FriendshipSection.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import { clearSocket } from "../../controllers/socket.js";
import { allLinks } from "../../controllers/constant.js";
import { RequestStatus } from "../../../js/chat-data.js";

function FriendshipPanel() {
  const { friendships } = useContext(InterfaceContext);

  useEffect(() => clearSocket, []);

  if (friendships === undefined) return <Loading name="friendships" />;
  else if (friendships === null) return <LoadFail name="friendships" />;
  else if (friendships === false) return <LoadError name="friendships" />;
  else if (friendships.length === 0) return <p>Friendships is empty.</p>;

  const acceptedRequest = friendships.filter(
    (friendship) => friendship.state === RequestStatus.ACCEPTED,
  );
  const sentRequest = friendships.filter(
    (friendship) =>
      friendship.state === RequestStatus.PENDING && !friendship.is_initiator,
  );
  const receivedRequest = friendships.filter(
    (friendship) =>
      friendship.state === RequestStatus.PENDING && friendship.is_initiator,
  );
  const rejectedRequest = friendships.filter(
    (friendship) =>
      friendship.state === RequestStatus.REJECTED && !friendship.is_initiator,
  );

  return (
    <div className="s-pad">
      <h2>Friendship Panel</h2>
      <p>Your friends and pending request is managed here.</p>
      <nav className="s-block-margin">
        <ul className="button-bar">
          <li>
            <Link to={allLinks.userList.href} className={"button-link"}>
              {allLinks.userList.name}
            </Link>
          </li>
        </ul>
      </nav>
      {receivedRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <FriendshipSection
            header="Received Request"
            friendships={receivedRequest}
            open
          />
        </>
      ) : null}
      {acceptedRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <FriendshipSection
            header="Friends"
            friendships={acceptedRequest}
            open
          />
        </>
      ) : null}
      {sentRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <FriendshipSection header="Sent Request" friendships={sentRequest} />
        </>
      ) : null}
      {rejectedRequest.length > 0 ? (
        <>
          <div className="line"></div>
          <FriendshipSection
            header="Rejected Request"
            friendships={rejectedRequest}
          />
        </>
      ) : null}
    </div>
  );
}

export default FriendshipPanel;

import { memo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import useDuration from "../../hooks/useDuration.jsx";
import { Group, Member, RequestStatus } from "../../../js/chat-data.js";

function GroupItem({ group }) {
  const membership = group.membership;
  const isApplicant = membership.isDefined();

  const duration = useDuration(membership.modified, !isApplicant);

  function postMembership() {
    window.socket.emit("postMembership", { group_id: group.id });
  }

  function deleteGroupApplication() {
    window.socket.emit("deleteGroupApplication", { group_id: group.id });
  }

  let status;
  const buttonArray = [];

  if (!isApplicant) {
    status = "";

    buttonArray.push({
      key: "apply",
      element: <button onClick={postMembership}>Apply</button>,
    });
  } else if (membership.state === RequestStatus.ACCEPTED) {
    status = membership.permission;

    buttonArray.push({
      key: "chat",
      element: (
        <Link to={"/group/" + group.id} className="button-link">
          Chat
        </Link>
      ),
    });

    if (membership.permission !== Member.permission.OWNER)
      buttonArray.push({
        key: "leave",
        element: <button>Leave</button>,
      });
  } else if (membership.state === RequestStatus.PENDING) {
    status = (
      <>
        {"applied - "}
        <time>{duration}</time>
      </>
    );

    buttonArray.push({
      key: "cancel",
      element: <button onClick={deleteGroupApplication}>Cancel</button>,
    });
  } else if (membership.state === RequestStatus.REJECTED) {
    status = (
      <>
        {"rejected - "}
        <time>{duration}</time>
      </>
    );
  }

  return (
    <tr>
      <td>
        <p className="clipped-text bold">{group.name}</p>
      </td>
      <td>
        <p className="clipped-text">{status}</p>
      </td>
      <td>
        <ul className="button-bar">
          {buttonArray.map((item) => (
            <li key={item.key}>{item.element}</li>
          ))}
        </ul>
      </td>
    </tr>
  );
}

GroupItem.propTypes = {
  group: PropTypes.instanceOf(Group).isRequired,
};

export default memo(GroupItem);

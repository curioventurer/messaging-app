import { useRef, useContext, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import ConfirmDialog from "../sys/ConfirmDialog.jsx";
import { RoomContext } from "./Room.jsx";
import { socket } from "../../controllers/socket.js";
import { Member } from "../../../js/chat-data.js";

function MemberItem({ member }) {
  const { room } = useContext(RoomContext);
  const dialog = useRef(null);

  const membership = room.membership;
  const power = membership.getPower();
  const memberPower = member.getPower();
  const notUser = membership.id !== member.id;
  const isOwner = membership.permission === Member.permission.OWNER;

  const promote = useCallback(
    function () {
      socket.emit("promoteMember", { id: member.id });
    },
    [member.id],
  );

  function demote() {
    socket.emit("demoteMember", { id: member.id });
  }

  //Show dialog if promoting an admin to owner.
  function handlePromote() {
    if (memberPower === 1)
      //admin
      dialog.current.showModal();
    else promote();
  }

  function leaveGroup() {
    socket.emit("leaveGroup", { id: member.id });
  }

  function kickMember() {
    socket.emit("kickMember", { id: member.id });
  }

  const buttonArray = [];

  buttonArray.push({
    key: "profile",
    element: (
      <Link to={"/profile/" + member.user_id} className="button-link">
        Profile
      </Link>
    ),
  });

  if (!notUser) {
    if (!isOwner)
      buttonArray.push({
        key: "leave",
        element: <button onClick={leaveGroup}>Leave</button>,
      });
  } else if (isOwner) {
    buttonArray.push({
      key: "promote",
      element: (
        <>
          <button onClick={handlePromote}>Promote</button>
          <ConfirmDialog dialog={dialog} confirm={promote}>
            <p>
              {"Are you sure you want to promote "}
              <span className="bold">{member.name}</span>
              {" to owner? You will be demoted to admin."}
            </p>
          </ConfirmDialog>
        </>
      ),
    });

    if (memberPower > 0)
      buttonArray.push({
        key: "demote",
        element: <button onClick={demote}>Demote</button>,
      });
  }

  if (notUser && power > memberPower)
    buttonArray.push({
      key: "kick",
      element: <button onClick={kickMember}>Kick</button>,
    });

  return (
    <tr>
      <td className="clipped-text">{member.name}</td>
      <td>{member.permission}</td>
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

MemberItem.propTypes = {
  member: PropTypes.instanceOf(Member).isRequired,
};

export default memo(MemberItem);

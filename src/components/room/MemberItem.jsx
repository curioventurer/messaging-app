import { useContext, memo } from "react";
import PropTypes from "prop-types";
import { RoomContext } from "./Room";
import { Member } from "../../../js/chat-data.js";

function MemberItem({ member }) {
  const { room } = useContext(RoomContext);
  const membership = room.membership;

  const power = membership.getPower();
  const memberPower = member.getPower();
  const notUser = membership.id !== member.id;
  const isOwner = membership.permission === Member.permission.OWNER;

  const buttonArray = [];

  if (!notUser) {
    if (!isOwner)
      buttonArray.push({
        key: "leave",
        element: <button>Leave</button>,
      });
  } else if (isOwner) {
    buttonArray.push({
      key: "promote",
      element: <button>Promote</button>,
    });

    if (memberPower > 0)
      buttonArray.push({
        key: "demote",
        element: <button>Demote</button>,
      });
  }

  if (notUser && power > memberPower)
    buttonArray.push({
      key: "kick",
      element: <button>Kick</button>,
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

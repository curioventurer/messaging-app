import { memo } from "react";
import PropTypes from "prop-types";
import { Member } from "../../js/chat-data.js";

function MemberItem({ member }) {
  return (
    <tr>
      <td className="clipped-text">{member.name}</td>
      <td>{member.permission}</td>
    </tr>
  );
}

MemberItem.propTypes = {
  member: PropTypes.instanceOf(Member).isRequired,
};

export default memo(MemberItem);

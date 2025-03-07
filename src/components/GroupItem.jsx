import { memo } from "react";
import PropTypes from "prop-types";
import { Group } from "../../js/chat-data.js";

function GroupItem({ group }) {
  return (
    <tr>
      <td>
        <p className="clipped-text bold">{group.name}</p>
      </td>
      <td>
        <p className="clipped-text">{group.created}</p>
      </td>
    </tr>
  );
}

GroupItem.propTypes = {
  group: PropTypes.instanceOf(Group).isRequired,
};

export default memo(GroupItem);

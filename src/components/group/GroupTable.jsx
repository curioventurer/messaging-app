import PropTypes from "prop-types";
import GroupItem from "./GroupItem.jsx";
import { Group } from "../../../js/chat-data.js";

function GroupTable({ groupList }) {
  return (
    <table className="list-table group">
      <tbody>
        {groupList.map((group) => (
          <GroupItem key={group.id} group={group} />
        ))}
      </tbody>
    </table>
  );
}

GroupTable.propTypes = {
  groupList: PropTypes.arrayOf(PropTypes.instanceOf(Group)).isRequired,
};

export default GroupTable;

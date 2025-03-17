import PropTypes from "prop-types";
import GroupItem from "./GroupItem.jsx";
import { Group } from "../../../js/chat-data.js";

function GroupSection({ header = "", groupList = [], open = false }) {
  return (
    <section>
      <details open={open}>
        <summary>
          <h3>
            {header} ({groupList.length})
          </h3>
        </summary>
        <table className="list-table group">
          <tbody>
            {groupList.map((group) => (
              <GroupItem key={group.id} group={group} />
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

GroupSection.propTypes = {
  header: PropTypes.string.isRequired,
  groupList: PropTypes.arrayOf(PropTypes.instanceOf(Group)).isRequired,
  open: PropTypes.bool,
};

export default GroupSection;

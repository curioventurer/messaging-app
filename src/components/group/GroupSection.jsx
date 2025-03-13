import PropTypes from "prop-types";
import GroupItem from "./GroupItem.jsx";
import { Group } from "../../../js/chat-data.js";

function GroupSection({ header = "", groups = [], open = false }) {
  return (
    <section>
      <details open={open}>
        <summary>
          <h3>
            {header} ({groups.length})
          </h3>
        </summary>
        <table className="list-table group">
          <tbody>
            {groups.map((group) => (
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
  groups: PropTypes.arrayOf(PropTypes.instanceOf(Group)).isRequired,
  open: PropTypes.bool,
};

export default GroupSection;

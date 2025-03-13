import PropTypes from "prop-types";
import MemberItem from "./MemberItem.jsx";
import MemberRequestItem from "./MemberRequestItem.jsx";
import { Member } from "../../../js/chat-data.js";

function MemberSection({
  header = "",
  members = [],
  className = "",
  open = false,
  request = false,
}) {
  return (
    <section className={className}>
      <details open={open}>
        <summary>
          <h3>
            {header} ({members.length})
          </h3>
        </summary>
        <table className="list-table member">
          <tbody>
            {members.map((member) =>
              request ? (
                <MemberRequestItem key={member.id} member={member} />
              ) : (
                <MemberItem key={member.id} member={member} />
              ),
            )}
          </tbody>
        </table>
      </details>
    </section>
  );
}

MemberSection.propTypes = {
  header: PropTypes.string.isRequired,
  members: PropTypes.arrayOf(PropTypes.instanceOf(Member)).isRequired,
  className: PropTypes.string,
  open: PropTypes.bool,
  request: PropTypes.bool,
};

export default MemberSection;

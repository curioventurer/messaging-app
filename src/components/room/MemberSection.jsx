import PropTypes from "prop-types";
import MemberItem from "./MemberItem.jsx";
import MemberRequestItem from "./MemberRequestItem.jsx";
import { Member } from "../../../js/chat-data.js";

function MemberSection({
  header = "",
  memberList = [],
  className = "",
  open = false,
  request = false,
}) {
  return (
    <section className={className}>
      <details open={open}>
        <summary>
          <h3>
            {header} ({memberList.length})
          </h3>
        </summary>
        <table className="list-table member">
          <tbody>
            {memberList.map((member) =>
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
  memberList: PropTypes.arrayOf(PropTypes.instanceOf(Member)).isRequired,
  className: PropTypes.string,
  open: PropTypes.bool,
  request: PropTypes.bool,
};

export default MemberSection;

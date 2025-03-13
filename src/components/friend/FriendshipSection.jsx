import PropTypes from "prop-types";
import FriendshipItem from "./FriendshipItem.jsx";
import { UserFriendship } from "../../../js/chat-data.js";

function FriendshipSection({ header = "", friendships = [], open = false }) {
  return (
    <section>
      <details open={open}>
        <summary>
          <h3>
            {header} ({friendships.length})
          </h3>
        </summary>
        <table className="list-table friend">
          <tbody>
            {friendships.map((friendship) => (
              <FriendshipItem key={friendship.id} friendship={friendship} />
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

FriendshipSection.propTypes = {
  header: PropTypes.string.isRequired,
  friendships: PropTypes.arrayOf(PropTypes.instanceOf(UserFriendship))
    .isRequired,
  open: PropTypes.bool,
};

export default FriendshipSection;

import PropTypes from "prop-types";
import FriendItem from "./FriendItem.jsx";
import { UserFriendship } from "../../../js/chat-data.js";

function FriendList({ friends = [] }) {
  return (
    <ul className="friend-list">
      {friends.map((friend) => (
        <li key={friend.id}>
          <FriendItem friend={friend} />
        </li>
      ))}
    </ul>
  );
}

FriendList.propTypes = {
  friends: PropTypes.arrayOf(PropTypes.instanceOf(UserFriendship)).isRequired,
};

export default FriendList;

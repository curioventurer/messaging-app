import PropTypes from "prop-types";
import FriendItem from "./FriendItem";
import { UserFriendship } from "../controllers/chat-data";

function FriendList({ friends }) {
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

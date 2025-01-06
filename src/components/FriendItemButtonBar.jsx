import { useContext } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { FriendOverviewContext } from "./FriendOverview.jsx";
import { FRIEND_REQUEST_TYPE } from "../controllers/constants.js";

function FriendItemButtonBar({ friend }) {
  const { showChat } = useContext(FriendOverviewContext);

  function answerRequest(event) {
    window.socket.emit("friend request update", {
      id: friend.id,
      state: event.target.value,
    });
  }

  const buttonArray = [];

  if (friend.state === FRIEND_REQUEST_TYPE.PENDING && friend.is_initiator) {
    buttonArray.push({
      key: "accept",
      element: (
        <button onClick={answerRequest} value={FRIEND_REQUEST_TYPE.ACCEPTED}>
          Accept
        </button>
      ),
    });
    buttonArray.push({
      key: "reject",
      element: (
        <button onClick={answerRequest} value={FRIEND_REQUEST_TYPE.REJECTED}>
          Reject
        </button>
      ),
    });
  }

  if (friend.state === FRIEND_REQUEST_TYPE.ACCEPTED && friend.direct_chat_id) {
    buttonArray.push({
      key: "chat",
      element: (
        <Link data-key="chat" to={"/chat/" + friend.direct_chat_id}>
          <button>Chat</button>
        </Link>
      ),
    });
  }

  if (friend.state === FRIEND_REQUEST_TYPE.ACCEPTED && !friend.direct_chat_id) {
    buttonArray.push({
      key: "show-chat",
      element: (
        <button
          onClick={() => {
            showChat(friend.user_id);
          }}
        >
          Show chat
        </button>
      ),
    });
  }

  if (buttonArray.length === 0) return null;

  return (
    <ul className="button-bar">
      {buttonArray.map((item) => (
        <li key={item.key}>{item.element}</li>
      ))}
    </ul>
  );
}

FriendItemButtonBar.propTypes = {
  friend: PropTypes.object.isRequired,
};

export default FriendItemButtonBar;

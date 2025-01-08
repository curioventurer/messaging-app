import { useContext, createContext } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import UnfriendButton from "./UnfriendButton.jsx";
import { FRIEND_REQUEST_TYPE } from "../controllers/constants.js";

export const UpdateDirectChatIdContext = createContext({
  updateDirectChatId: function () {},
});

function FriendItemButtonBar({ friend }) {
  const { updateDirectChatId } = useContext(UpdateDirectChatIdContext);

  function answerRequest(event) {
    window.socket.emit("friend request update", {
      id: friend.id,
      state: event.target.value,
    });
  }

  function showChat(user_id) {
    const request = new Request(`/api/open_chat/${user_id}`, {
      method: "POST",
    });

    fetch(request)
      .then((res) => res.json())
      .then((direct_chat_id) => {
        if (direct_chat_id === false) return;

        updateDirectChatId(user_id, direct_chat_id);
      })
      .catch(() => {});
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

  if (friend.state === FRIEND_REQUEST_TYPE.ACCEPTED) {
    if (friend.direct_chat_id)
      buttonArray.push({
        key: "chat",
        element: (
          <Link data-key="chat" to={"/chat/" + friend.direct_chat_id}>
            <button>Chat</button>
          </Link>
        ),
      });
    else
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

    buttonArray.push({
      key: "unfriend",
      element: <UnfriendButton friend={friend} />,
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

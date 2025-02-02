import { useContext, createContext } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import UnfriendButton from "./UnfriendButton.jsx";
import { UserFriendship, FriendRequest } from "../controllers/chat-data.js";

export const UpdateDirectChatIdContext = createContext({
  updateDirectChatId: function () {},
});

function FriendButtonBar({ friend }) {
  const { updateDirectChatId } = useContext(UpdateDirectChatIdContext);

  function addFriend() {
    window.socket.emit("add friend", {
      id: friend.user_id,
    });
  }

  function inverseAdd() {
    window.socket.emit("reverse friend request", {
      id: friend.id,
    });
  }

  function answerRequest(event) {
    window.socket.emit("friend request update", {
      id: friend.id,
      state: event.target.value,
    });
  }

  function deleteRequest() {
    window.socket.emit("delete friend request", {
      id: friend.id,
    });
  }

  function showChat() {
    const user_id = friend.user_id;
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

  /*Default value is used, meaning the friendship relation is absent.
    Thus, provide add friend button.
  */
  if (!friend.isDefined())
    buttonArray.push({
      key: "add",
      element: <button onClick={addFriend}>Add</button>,
    });
  else if (friend.state === FriendRequest.PENDING) {
    if (friend.is_initiator) {
      buttonArray.push({
        key: "accept",
        element: (
          <button onClick={answerRequest} value={FriendRequest.ACCEPTED}>
            Accept
          </button>
        ),
      });
      buttonArray.push({
        key: "reject",
        element: (
          <button onClick={answerRequest} value={FriendRequest.REJECTED}>
            Reject
          </button>
        ),
      });
    } else
      buttonArray.push({
        key: "cancel",
        element: <button onClick={deleteRequest}>Cancel</button>,
      });
  } else if (friend.state === FriendRequest.REJECTED && friend.is_initiator)
    buttonArray.push({
      key: "inverse add",
      element: <button onClick={inverseAdd}>Add</button>,
    });
  else if (friend.state === FriendRequest.ACCEPTED) {
    //if not default value(0), chat is already shown, provide link to chat
    if (friend.direct_chat_id !== 0)
      buttonArray.push({
        key: "chat",
        element: (
          <Link to={"/chat/" + friend.direct_chat_id} className="button-link">
            Chat
          </Link>
        ),
      });
    //chat not shown, add show chat button
    else
      buttonArray.push({
        key: "show-chat",
        element: <button onClick={showChat}>Show chat</button>,
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

FriendButtonBar.propTypes = {
  friend: PropTypes.instanceOf(UserFriendship).isRequired,
};

export default FriendButtonBar;

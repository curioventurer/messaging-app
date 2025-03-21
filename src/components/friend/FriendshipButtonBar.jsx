import { memo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import UnfriendButton from "./UnfriendButton.jsx";
import { socket } from "../../controllers/socket.js";
import { UserFriendship, RequestStatus } from "../../../js/chat-data.js";

function FriendshipButtonBar({ friendship }) {
  function addFriend() {
    socket.emit("add friend", {
      id: friendship.user_id,
    });
  }

  function inverseAdd() {
    socket.emit("reverse friend request", {
      id: friendship.id,
    });
  }

  function answerRequest(event) {
    socket.emit("friend request update", {
      id: friendship.id,
      state: event.target.value,
    });
  }

  function deleteRequest() {
    socket.emit("delete friend request", {
      id: friendship.id,
    });
  }

  function showChat() {
    const user_id = friendship.user_id;
    const request = new Request(`/api/open_chat/${user_id}`, {
      method: "POST",
    });

    fetch(request)
      .then((res) => res.json())
      .then((direct_id) => {
        if (direct_id === false) return;
      })
      .catch(() => {});
  }

  const buttonArray = [];

  /*Default value is used, meaning the friendship relation is absent.
    Thus, provide add friend button.
  */
  if (!friendship.isDefined())
    buttonArray.push({
      key: "add",
      element: <button onClick={addFriend}>Add</button>,
    });
  else if (friendship.state === RequestStatus.PENDING) {
    if (friendship.is_initiator) {
      buttonArray.push({
        key: "accept",
        element: (
          <button onClick={answerRequest} value={RequestStatus.ACCEPTED}>
            Accept
          </button>
        ),
      });
      buttonArray.push({
        key: "reject",
        element: (
          <button onClick={answerRequest} value={RequestStatus.REJECTED}>
            Reject
          </button>
        ),
      });
    } else
      buttonArray.push({
        key: "cancel",
        element: <button onClick={deleteRequest}>Cancel</button>,
      });
  } else if (
    friendship.state === RequestStatus.REJECTED &&
    friendship.is_initiator
  )
    buttonArray.push({
      key: "inverse add",
      element: <button onClick={inverseAdd}>Add</button>,
    });
  else if (friendship.state === RequestStatus.ACCEPTED) {
    //if not default value(0), chat is already shown, provide link to chat
    if (friendship.direct_chat_id !== 0)
      buttonArray.push({
        key: "chat",
        element: (
          <Link
            to={"/chat/" + friendship.direct_chat_id}
            className="button-link"
          >
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
      element: <UnfriendButton friendship={friendship} />,
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

FriendshipButtonBar.propTypes = {
  friendship: PropTypes.instanceOf(UserFriendship).isRequired,
};

export default memo(FriendshipButtonBar);

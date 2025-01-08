import { useRef } from "react";
import PropTypes from "prop-types";

function UnfriendButton({ friend }) {
  const dialogRef = useRef(null);

  function unfriend() {
    window.socket.emit("unfriend", {
      friendship_id: friend.id,
    });
    closeDialog();
  }

  function closeDialog() {
    dialogRef.current.close();
  }

  return (
    <>
      <button
        onClick={() => {
          dialogRef.current.showModal();
        }}
      >
        Unfriend
      </button>
      <dialog ref={dialogRef} className="confirmation-dialog">
        <p>
          {"Are you sure you want to unfriend "}
          <span className="name">{friend.name}</span>
          {
            "? This will delete all messages in direct chat for both users, and is irreversible."
          }
        </p>
        <ul>
          <li>
            <button onClick={unfriend}>Yes</button>
          </li>
          <li>
            <button onClick={closeDialog}>No</button>
          </li>
        </ul>
      </dialog>
    </>
  );
}

UnfriendButton.propTypes = {
  friend: PropTypes.object.isRequired,
};

export default UnfriendButton;

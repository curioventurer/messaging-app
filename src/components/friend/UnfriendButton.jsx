import { useRef, useCallback } from "react";
import PropTypes from "prop-types";
import ConfirmDialog from "../ConfirmDialog";

function UnfriendButton({ friendship }) {
  const dialog = useRef(null);

  const storeDialog = useCallback(function (element) {
    dialog.current = element;
  }, []);

  function unfriend() {
    window.socket.emit("unfriend", {
      friendship_id: friendship.id,
    });
  }

  return (
    <>
      <button
        onClick={() => {
          dialog.current.showModal();
        }}
      >
        Unfriend
      </button>
      <ConfirmDialog storeDialog={storeDialog} confirm={unfriend}>
        <p>
          {"Are you sure you want to unfriend "}
          <span className="bold">{friendship.name}</span>
          {
            "? This will delete all messages in direct chat for both users, and is irreversible."
          }
        </p>
      </ConfirmDialog>
    </>
  );
}

UnfriendButton.propTypes = {
  friendship: PropTypes.object.isRequired,
};

export default UnfriendButton;

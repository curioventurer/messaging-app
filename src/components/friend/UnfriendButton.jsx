import { useRef, useCallback, memo } from "react";
import PropTypes from "prop-types";
import ConfirmDialog from "../sys/ConfirmDialog.jsx";
import { socket } from "../../controllers/socket.js";

function UnfriendButton({ friendship }) {
  const dialog = useRef(null);

  const unfriend = useCallback(
    function () {
      socket.emit("unfriend", {
        friendship_id: friendship.id,
      });
    },
    [friendship.id],
  );

  return (
    <>
      <button
        onClick={() => {
          dialog.current.showModal();
        }}
      >
        Unfriend
      </button>
      <ConfirmDialog dialog={dialog} confirm={unfriend}>
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

export default memo(UnfriendButton);

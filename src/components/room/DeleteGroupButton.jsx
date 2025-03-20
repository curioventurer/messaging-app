import { useRef, useContext, useCallback } from "react";
import ConfirmDialog from "../ConfirmDialog.jsx";
import { RoomContext } from "./Room.jsx";
import { socket } from "../../controllers/socket.js";

function DeleteGroupButton() {
  const { room } = useContext(RoomContext);
  const dialog = useRef(null);

  const deleteGroup = useCallback(
    function () {
      socket.emit("deleteGroup", {
        id: room.id,
      });
    },
    [room.id],
  );

  return (
    <div className="s-block-margin">
      <button
        onClick={() => {
          dialog.current.showModal();
        }}
      >
        Delete Group
      </button>
      <ConfirmDialog dialog={dialog} confirm={deleteGroup}>
        <p>
          {"Are you sure you want to delete group "}
          <span className="bold">{room.name}</span>
          {"? This will delete all messages in the group, and is irreversible."}
        </p>
      </ConfirmDialog>
    </div>
  );
}

export default DeleteGroupButton;

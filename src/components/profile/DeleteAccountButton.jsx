import { useRef, useContext, useCallback } from "react";
import ConfirmDialog from "../ConfirmDialog.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import { socket } from "../../controllers/socket.js";

function DeleteAccountButton() {
  const { client } = useContext(InterfaceContext);
  const dialog = useRef(null);

  const deleteAccount = useCallback(function () {
    socket.emit("deleteAccount", {});
  }, []);

  return (
    <div className="s-block-margin">
      <button
        onClick={() => {
          dialog.current.showModal();
        }}
      >
        Delete Account
      </button>
      <ConfirmDialog dialog={dialog} confirm={deleteAccount}>
        <>
          <p>
            {"Are you sure you want to delete your account "}
            <span className="bold">{client.name}</span>
            {"? This will delete your data, and is irreversible."}
          </p>
          <p className="list-header">Deleted: </p>
          <ul className="marked-list">
            <li>All direct chats and messages within.</li>
            <li>All owned groups and messages within.</li>
            <li>Profile info.</li>
          </ul>
          <p className="list-header">Not deleted: </p>
          <ul className="marked-list">
            <li>Messages in groups you do not own.</li>
          </ul>
        </>
      </ConfirmDialog>
    </div>
  );
}

export default DeleteAccountButton;

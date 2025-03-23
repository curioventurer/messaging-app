import { memo } from "react";
import PropTypes from "prop-types";

function ConfirmDialog({ children, dialog, confirm, disable = false }) {
  function confirmDialog() {
    closeDialog();
    confirm();
  }

  function closeDialog() {
    dialog.current.close();
  }

  return (
    <dialog ref={dialog} className="confirmation-dialog">
      {children}
      <ul className="button-bar">
        {!disable ? (
          <>
            <li>
              <button className="low-bright" onClick={confirmDialog}>
                Yes
              </button>
            </li>
            <li>
              <button className="low-bright" onClick={closeDialog}>
                No
              </button>
            </li>
          </>
        ) : (
          <li>
            <button className="low-bright" onClick={closeDialog}>
              Close
            </button>
          </li>
        )}
      </ul>
    </dialog>
  );
}

ConfirmDialog.propTypes = {
  children: PropTypes.element.isRequired,
  dialog: PropTypes.object.isRequired,
  confirm: PropTypes.func.isRequired,
  disable: PropTypes.bool,
};

export default memo(ConfirmDialog);

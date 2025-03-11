import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

function ConfirmDialog({ children, storeDialog, confirm }) {
  const dialog = useRef(null);

  useEffect(() => {
    storeDialog(dialog.current);
  }, [storeDialog]);

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
      <ul>
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
      </ul>
    </dialog>
  );
}

ConfirmDialog.propTypes = {
  children: PropTypes.element.isRequired,
  storeDialog: PropTypes.func.isRequired,
  confirm: PropTypes.func.isRequired,
};

export default ConfirmDialog;

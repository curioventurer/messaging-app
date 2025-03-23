import { useRef, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import ConfirmDialog from "../ConfirmDialog.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import { socket } from "../../controllers/socket.js";
import { allLinks } from "../../controllers/constant.js";
import { Member, RequestStatus } from "../../../js/chat-data.js";

function DeleteAccountButton() {
  const { client, friendships, groupList } = useContext(InterfaceContext);
  const dialog = useRef(null);

  const navigate = useNavigate();

  const deleteAccount = useCallback(
    function () {
      const request = new Request("/api/user", {
        method: "DELETE",
      });

      fetch(request)
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          if (!data) return;

          socket.disconnect();
          localStorage.removeItem("user");
          navigate(allLinks.login.href + "?msg=account+deleted");
        });
    },
    [navigate],
  );

  if (friendships === false || groupList === false)
    return <LoadError name="button" />;
  else if (friendships === null || groupList === null)
    return <LoadFail name="button" />;
  else if (friendships === undefined || groupList === undefined)
    return <Loading name="button" />;

  const friends = friendships.filter((friend) => friend.isAccepted());
  const acceptedGroups = groupList.filter(
    (group) => group.membership.state === RequestStatus.ACCEPTED,
  );
  const ownedGroups = acceptedGroups.filter(
    (group) => group.membership.permission === Member.permission.OWNER,
  );
  const memberGroups = acceptedGroups.filter(
    (group) => group.membership.permission !== Member.permission.OWNER,
  );

  const requirementCount =
    ownedGroups.length + memberGroups.length + friends.length;
  const dialogIsDisabled = requirementCount > 0;

  return (
    <div className="s-block-margin">
      <button
        onClick={() => {
          dialog.current.showModal();
        }}
      >
        Delete Account
      </button>
      <ConfirmDialog
        dialog={dialog}
        confirm={deleteAccount}
        disable={dialogIsDisabled}
      >
        <>
          <p>
            {"Are you sure you want to delete your account "}
            <span className="bold">{client.name}</span>
            {"? This will delete all your data, and is irreversible."}
          </p>
          {dialogIsDisabled ? (
            <>
              <p className="list-header">
                {
                  "The following requirements must be met before deleting your account."
                }
              </p>
              <ul className="marked-list">
                {ownedGroups.length > 0 ? (
                  <li>
                    Delete or transfer ownership for all the groups you owned (
                    {ownedGroups.length})
                  </li>
                ) : null}
                {memberGroups.length > 0 ? (
                  <li>
                    Leave all the groups you joined ({memberGroups.length})
                  </li>
                ) : null}
                {friends.length > 0 ? (
                  <li>Unfriend all your friends ({friends.length})</li>
                ) : null}
              </ul>
            </>
          ) : null}
        </>
      </ConfirmDialog>
    </div>
  );
}

export default DeleteAccountButton;

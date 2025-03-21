import { useContext } from "react";
import useDuration from "../../hooks/useDuration.jsx";
import DeleteAccountButton from "./DeleteAccountButton.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import DateFormat from "../../controllers/DateFormat.js";

function Profile() {
  const { client } = useContext(InterfaceContext);

  const duration = useDuration(client.created);

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <ul>
        <li>
          <span className="bold">Name:</span> {client.name}
        </li>
        <li>
          <span className="bold">ID:</span> {client.id}
        </li>
        <li>
          <span className="bold">Created on: </span>
          <time dateTime={client.created}>
            {DateFormat.timestamp(client.created)}{" "}
          </time>
          ({duration})
        </li>
        <li>
          <span className="bold">Guest account:</span> {String(client.is_guest)}
        </li>
      </ul>
      <DeleteAccountButton />
    </div>
  );
}

export default Profile;

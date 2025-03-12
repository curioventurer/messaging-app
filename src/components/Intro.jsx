import { useContext } from "react";
import { Link } from "react-router-dom";
import { InterfaceContext } from "./layout/PrivateInterface";

function Intro() {
  const { client } = useContext(InterfaceContext);

  return (
    <div className="intro">
      <h1>Intro</h1>
      {client ? (
        <p>
          Welcome <span className="bold">{client.name}</span>, to our messaging
          app! Go to <Link to="/home">home</Link> to access logged in features.
        </p>
      ) : (
        <>
          <p>You are not logged in. Please login to access our features.</p>
          <ul className="marked-list">
            <li>
              <Link to="/guest-login">Guest login</Link> to try without an
              account.
            </li>
            <li>
              <Link to="/login">Login</Link> to enter your account.
            </li>
            <li>
              <Link to="/register">Register</Link> to create an account.
            </li>
          </ul>
        </>
      )}
    </div>
  );
}

export default Intro;

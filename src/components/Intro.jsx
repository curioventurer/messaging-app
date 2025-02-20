import { useContext } from "react";
import { Link } from "react-router-dom";
import { InterfaceContext } from "./PrivateInterface";

function Intro() {
  const client = useContext(InterfaceContext);

  return (
    <>
      <h1>Intro</h1>
      {client ? (
        <p>
          Welcome <span className="bold">{client.name}</span>, to our messaging
          app! Go to <Link to="/home">home</Link> to access logged in features.
        </p>
      ) : (
        <p>
          You are not logged in. <Link to="/login">Login</Link> or{" "}
          <Link to="/register">register</Link> to access logged in features.
        </p>
      )}
    </>
  );
}

export default Intro;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function LogInForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState("Enter your name and password to login");
  const [isBlink, setIsBlink] = useState(false);

  const navigate = useNavigate();

  function updateName(event) {
    setName(event.target.value);
  }

  function updatePassword(event) {
    setPassword(event.target.value);
  }

  function updateOutput(info) {
    let message;

    if (info === "name") message = "Name not found";
    else if (info === "password") message = "Wrong password";
    else message = info;

    setOutput("Login failure: " + message);
    blink();
  }

  function blink() {
    if (isBlink) {
      //if already true, switch it off and on again to replay the animation.
      setIsBlink(false);
      setTimeout(() => setIsBlink(true), 0);
    } else setIsBlink(true);
  }

  function login(event) {
    event.preventDefault();

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const request = new Request("/api/log-in", {
      method: "POST",
      body: JSON.stringify({ name, password }),
      headers,
    });

    fetch(request)
      .then((res) => res.json())
      .then(({ err, user, info }) => {
        if (user) navigate("/");
        else if (err) updateOutput(err);
        else updateOutput(info);
      })
      .catch(() => {});
  }

  return (
    <div className="auth-page log-in-page">
      <h1>Log In</h1>
      <p>
        {"Please login to access the site. If you don't have an account, "}
        <Link to="/sign-up">sign up</Link>
        {" now."}
      </p>
      <form onSubmit={login}>
        <ul>
          <li>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="name"
              value={name}
              onChange={updateName}
            />
          </li>
          <li>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="password"
              value={password}
              onChange={updatePassword}
            />
          </li>
          <li>
            <button>Log In</button>
          </li>
        </ul>
        <output className={isBlink ? "blink" : ""}>{output}</output>
      </form>
      <Link to="/sign-up">Sign Up</Link>
    </div>
  );
}

export default LogInForm;

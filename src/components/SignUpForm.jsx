import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function SignUpForm() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState(
    "Enter a name and password to create an account",
  );
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

    message = info;

    setOutput("Signup failure: " + message);
    blink();
  }

  function blink() {
    if (isBlink) {
      //if already true, switch it off and on again to replay the animation.
      setIsBlink(false);
      setTimeout(() => setIsBlink(true), 0);
    } else setIsBlink(true);
  }

  function signup(event) {
    event.preventDefault();

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const request = new Request("/api/sign-up", {
      method: "POST",
      body: JSON.stringify({ name, password }),
      headers,
    });

    fetch(request)
      .then((res) => res.json())
      .then(({ err, user, info }) => {
        if (user) navigate("/log-in");
        else if (err) updateOutput(err);
        else updateOutput(info);
      })
      .catch(() => {});
  }

  return (
    <div className="auth-page sign-up-page">
      <h1>Sign Up</h1>
      <p>
        {
          "Signup to create an account to access the site. If you already have an account, "
        }
        <Link to="/log-in">login</Link>
        {" instead."}
      </p>
      <form onSubmit={signup}>
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
            <button>Sign Up</button>
          </li>
        </ul>
        <output className={isBlink ? "blink" : ""}>{output}</output>
      </form>
      <Link to="/log-in">Log In</Link>
    </div>
  );
}

export default SignUpForm;

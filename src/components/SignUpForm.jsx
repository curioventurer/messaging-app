import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

function SignUpForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [output, setOutput] = useState("Tip: fill in the form");
  const [passwordIsShown, setPasswordIsShown] = useState(false);
  const [isBlink, setIsBlink] = useState(false);

  const outputRef = useRef(null);

  const navigate = useNavigate();

  function updateUsername(event) {
    setUsername(event.target.value);
  }

  function updatePassword(event) {
    setPassword(event.target.value);
  }

  function updateConfirmPassword(event) {
    setConfirmPassword(event.target.value);
  }

  function updateOutput(err, info) {
    let message;

    if (err) message = "database error";
    else message = info.message;

    setOutput("Error: " + message);
    blink();
  }

  function showPassword() {
    if (passwordIsShown) {
      setPasswordIsShown(false);
    } else {
      setPasswordIsShown(true);
    }
  }

  function blink() {
    outputRef.current.scrollIntoView({ behavior: "smooth", block: "end" });

    //Only blink if not currently blinking
    if (!isBlink) {
      setIsBlink(true);

      //switch off blink after some duration
      setTimeout(() => setIsBlink(false), 1000);
    }
  }

  function signup(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      updateOutput(null, { message: "password does not match" });
      return;
    }

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const request = new Request("/api/sign-up", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers,
    });

    fetch(request)
      .then((res) => res.json())
      .then(({ err, user, info }) => {
        if (user) navigate("/home");
        else if (err) updateOutput(err);
        else updateOutput(null, info);
      })
      .catch(() => {});
  }

  return (
    <div className="auth-page sign-up-page">
      <h1>Sign Up</h1>
      <form onSubmit={signup}>
        <ul>
          <li>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              aria-describedby="username-hint"
              maxLength="50"
              pattern="\w+"
              value={username}
              onChange={updateUsername}
              autoComplete="off"
              required
              autoFocus
            />
            <p id="username-hint">1-50 word characters (a-z, A-Z, 0-9, _).</p>
          </li>
          <li>
            <label htmlFor="new-password">Password</label>
            <button
              type="button"
              className="show-password"
              aria-label={
                passwordIsShown
                  ? "hide password"
                  : "warning: this will display your password on the screen as plain text"
              }
              onClick={showPassword}
            >
              {passwordIsShown ? "Hide password" : "Show password"}
            </button>
            <input
              type={passwordIsShown ? "text" : "password"}
              name="password"
              id="new-password"
              aria-describedby="password-hint"
              minLength="6"
              maxLength="30"
              value={password}
              onChange={updatePassword}
              autoComplete="new-password"
              required
            />
            <p id="password-hint">6-30 characters.</p>
          </li>
          <li>
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              type={passwordIsShown ? "text" : "password"}
              name="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={updateConfirmPassword}
              autoComplete="new-password"
              required
            />
          </li>
          <li>
            <button type="submit">Sign Up</button>
          </li>
        </ul>
        <output
          name="signup result"
          htmlFor="username new-password confirm-password"
          ref={outputRef}
          className={isBlink ? "blink" : ""}
        >
          {output}
        </output>
      </form>
      <ul>
        <li>
          <Link to="/log-in">Login</Link>
          {" to enter your account."}
        </li>
        <li>
          <Link to="/">Intro</Link>
          {" to see introduction."}
        </li>
      </ul>
    </div>
  );
}

export default SignUpForm;

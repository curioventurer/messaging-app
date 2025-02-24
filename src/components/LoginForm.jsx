import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthForm from "./AuthForm";

function LoginForm() {
  const [searchParams] = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordIsShown, setPasswordIsShown] = useState(false);

  const usernameInput = useRef(null);
  const passwordInput = useRef(null);
  const submitButton = useRef(null);

  const redirectPath = searchParams.get("rdr");
  let otherPath = "/register";

  if (redirectPath) otherPath += "?rdr=" + encodeURIComponent(redirectPath);

  function updateSubmitting(bool) {
    setSubmitting(bool);
  }

  function updateUsername(event) {
    setUsername(event.target.value);
  }

  function updatePassword(event) {
    setPassword(event.target.value);
  }

  function showPassword() {
    if (passwordIsShown) {
      setPasswordIsShown(false);
    } else {
      setPasswordIsShown(true);
    }
  }

  function parseSubmitRes(err, info) {
    let message, focusTarget;

    if (err) message = "database error";
    else message = info.message;

    if (message === "wrong username") focusTarget = usernameInput;
    else if (message == "wrong password") focusTarget = passwordInput;
    else focusTarget = usernameInput;

    return {
      message,
      focusTarget,
    };
  }

  const formInfo = {
    register: false,
    outputFor: "username current-password",
    submitButton,
    data: { username, password },
    submitting,
    updateSubmitting,
    validateInputs: () => true,
    parseSubmitRes,
  };

  return (
    <div className="auth-page">
      <h1>Login</h1>
      <AuthForm formInfo={formInfo}>
        <ul>
          <li>
            <label htmlFor="username">Username</label>
            <input
              ref={usernameInput}
              type="text"
              name="username"
              id="username"
              maxLength="50"
              pattern="\w+"
              value={username}
              onChange={updateUsername}
              autoComplete="username"
              disabled={submitting}
              required
            />
          </li>
          <li>
            <label htmlFor="current-password">Password</label>
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
              ref={passwordInput}
              type={passwordIsShown ? "text" : "password"}
              name="password"
              id="current-password"
              minLength="6"
              maxLength="30"
              value={password}
              onChange={updatePassword}
              autoComplete="current-password"
              disabled={submitting}
              required
            />
          </li>
          <li>
            <button
              ref={submitButton}
              type="submit"
              disabled={submitting}
              autoFocus
            >
              {submitting ? "Waiting..." : "Login"}
            </button>
          </li>
        </ul>
      </AuthForm>
      <ul>
        <li>
          <Link to={otherPath}>Register</Link>
          {" to create an account."}
        </li>
        <li>
          <Link to="/">Intro</Link>
          {" to see introduction."}
        </li>
      </ul>
    </div>
  );
}

export default LoginForm;

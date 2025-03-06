import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthForm from "./AuthForm";
import { User } from "../../js/chat-data.js";

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
  const redirectQuery = redirectPath
    ? "?rdr=" + encodeURIComponent(redirectPath)
    : "";

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
    path: "/api/login",
    data: { username, password },
    initialOutput: "Tip: enter username and password to login",
    outputName: "login result",
    outputFor: "username current-password",
    submitting,
    submitButton,
    validateInputs: () => true,
    parseSubmitRes,
    updateSubmitting,
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
              pattern={User.usernameRegex}
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
          <Link to={"/guest-login" + redirectQuery}>Guest login</Link>
          {" to try without an account."}
        </li>
        <li>
          <Link to={"/register" + redirectQuery}>Register</Link>
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

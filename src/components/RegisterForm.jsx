import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthForm from "./AuthForm";

function RegisterForm() {
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordIsShown, setPasswordIsShown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const usernameInput = useRef(null);
  const submitButton = useRef(null);

  const redirectPath = searchParams.get("rdr");
  let otherPath = "/login";

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

  function updateConfirmPassword(event) {
    setConfirmPassword(event.target.value);
  }

  function showPassword() {
    if (passwordIsShown) {
      setPasswordIsShown(false);
    } else {
      setPasswordIsShown(true);
    }
  }

  function validateInputs() {
    if (password === confirmPassword) return true;

    return {
      message: "password does not match",
    };
  }

  function parseSubmitRes(err, info) {
    let message, focusTarget;

    if (err) message = "database error";
    else message = info.message;

    if (message === "username taken") focusTarget = usernameInput;
    else focusTarget = usernameInput;

    return {
      message,
      focusTarget,
    };
  }

  const formInfo = {
    register: true,
    outputFor: "username new-password confirm-password",
    submitButton,
    data: { username, password },
    submitting,
    updateSubmitting,
    validateInputs,
    parseSubmitRes,
  };

  return (
    <div className="auth-page">
      <h1>Register</h1>
      <AuthForm formInfo={formInfo}>
        <ul>
          <li>
            <label htmlFor="username">Username</label>
            <input
              ref={usernameInput}
              type="text"
              name="username"
              id="username"
              aria-describedby="username-hint"
              maxLength="50"
              pattern="\w+"
              value={username}
              onChange={updateUsername}
              autoComplete="off"
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
              required
            />
          </li>
          <li>
            <button ref={submitButton} type="submit" disabled={submitting}>
              {submitting ? "Waiting..." : "Register"}
            </button>
          </li>
        </ul>
      </AuthForm>
      <ul>
        <li>
          <Link to={otherPath}>Login</Link>
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

export default RegisterForm;

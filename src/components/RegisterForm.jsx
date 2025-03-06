import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthForm from "./AuthForm";
import { User } from "../../js/chat-data.js";

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
    path: "/api/register",
    data: { username, password },
    initialOutput: "Tip: fill in the form",
    outputName: "registration result",
    outputFor: "username new-password confirm-password",
    submitting,
    submitButton,
    validateInputs,
    parseSubmitRes,
    updateSubmitting,
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
              pattern={User.usernameRegex}
              value={username}
              onChange={updateUsername}
              autoComplete="off"
              disabled={submitting}
              required
              autoFocus
            />
            <ul id="username-hint" className="form-hint marked-list">
              <li>1-50 word characters (a-z, A-Z, 0-9, _).</li>
              <li>&quot;guest_&quot; not allowed in front of username.</li>
            </ul>
          </li>
          <li>
            <label htmlFor="new-password">Password</label>
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
            <ul id="password-hint" className="form-hint marked-list">
              <li>6-30 characters.</li>
            </ul>
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
          <Link to={"/login" + redirectQuery}>Login</Link>
          {" to enter your account."}
        </li>
        <li>
          <Link to={"/guest-login" + redirectQuery}>Guest login</Link>
          {" to try without an account."}
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

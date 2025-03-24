import { useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import useMsgQuery from "../../hooks/useMsgQuery.jsx";
import Form from "./Form.jsx";
import { FormDetail, User } from "../../../js/chat-data.js";

function RegisterForm() {
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordIsShown, setPasswordIsShown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameInput = useRef(null);
  const submitButton = useRef(null);

  const redirectPath = searchParams.get("rdr");
  const redirectQuery = redirectPath
    ? "?rdr=" + encodeURIComponent(redirectPath)
    : "";

  const navigate = useNavigate();

  function updateIsSubmitting(bool) {
    setIsSubmitting(bool);
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

  function parseOutput(err, info) {
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

  function handleSubmitRes(err, user, info, updateOutput) {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("session-date", JSON.stringify(Date.now()));

      navigate(searchParams.get("rdr") ?? "/home", {
        replace: true,
      });
    } else updateOutput(parseOutput(err, info));
  }

  const message = useMsgQuery();
  const outputInitial = message ? "Result: " + message : undefined;

  const formDetail = new FormDetail({
    path: "/api/register",
    data: { username, password },
    outputInitial,
    outputName: "registration result",
    outputFor: "username new-password confirm-password",
    isSubmitting,
    submitButton,
    validateInputs,
    handleSubmitRes,
    updateIsSubmitting,
  });

  return (
    <div className="form-page auth-page">
      <h1>Register</h1>
      <Form formDetail={formDetail}>
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
              disabled={isSubmitting}
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
              className="clear-background"
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              required
            />
          </li>
          <li>
            <button ref={submitButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Waiting..." : "Register"}
            </button>
          </li>
        </ul>
      </Form>
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

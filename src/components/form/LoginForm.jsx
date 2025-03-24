import { useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import useMsgQuery from "../../hooks/useMsgQuery.jsx";
import Form from "./Form.jsx";
import { FormDetail, User } from "../../../js/chat-data.js";

function LoginForm() {
  const [searchParams] = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  function showPassword() {
    if (passwordIsShown) {
      setPasswordIsShown(false);
    } else {
      setPasswordIsShown(true);
    }
  }

  function parseOutput(err, info) {
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
  const outputInitial = message
    ? "Result: " + message
    : "Tip: enter username and password to login";

  const formDetail = new FormDetail({
    path: "/api/login",
    data: { username, password },
    outputInitial,
    outputName: "login result",
    outputFor: "username current-password",
    isSubmitting,
    submitButton,
    handleSubmitRes,
    updateIsSubmitting,
  });

  return (
    <div className="form-page auth-page">
      <h1>Login</h1>
      <Form formDetail={formDetail}>
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
              disabled={isSubmitting}
              required
            />
          </li>
          <li>
            <label htmlFor="current-password">Password</label>
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
              ref={passwordInput}
              type={passwordIsShown ? "text" : "password"}
              name="password"
              id="current-password"
              minLength="6"
              maxLength="30"
              value={password}
              onChange={updatePassword}
              autoComplete="current-password"
              disabled={isSubmitting}
              required
            />
          </li>
          <li>
            <button
              ref={submitButton}
              type="submit"
              disabled={isSubmitting}
              autoFocus
            >
              {isSubmitting ? "Waiting..." : "Login"}
            </button>
          </li>
        </ul>
      </Form>
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

import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthForm from "./AuthForm.jsx";
import { User } from "../../../js/chat-data.js";

function GuestLoginForm() {
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState(User.GUEST_LABEL);
  const [submitting, setSubmitting] = useState(false);

  const usernameInput = useRef(null);
  const submitButton = useRef(null);

  const redirectPath = searchParams.get("rdr");
  const redirectQuery = redirectPath
    ? "?rdr=" + encodeURIComponent(redirectPath)
    : "";

  useEffect(() => {
    generateUsername();
  }, []);

  function updateSubmitting(bool) {
    setSubmitting(bool);
  }

  function updateUsername(event) {
    const value = event.target.value;

    //Prevent modification of the label in front of username.
    if (User.isGuest(value)) setUsername(value);
  }

  //Add random 4 digits to the guest label.
  function generateUsername() {
    const DIGITS = 4;
    const number = Math.floor(Math.random() * Math.pow(10, DIGITS));
    setUsername(User.GUEST_LABEL + number.toString().padStart(DIGITS, "0"));
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
    path: "/api/guest-login",
    data: { username },
    initialOutput: "Tip: generate or enter username",
    outputName: "guest login result",
    outputFor: "username",
    submitting,
    submitButton,
    validateInputs: () => true,
    parseSubmitRes,
    updateSubmitting,
  };

  return (
    <div className="auth-page">
      <h1>Guest Login</h1>
      <AuthForm formInfo={formInfo}>
        <ul>
          <li>
            <label htmlFor="username">Username</label>
            <button
              type="button"
              className="clear-background"
              onClick={generateUsername}
              disabled={submitting}
            >
              Generate Username
            </button>
            <input
              ref={usernameInput}
              type="text"
              name="username"
              id="username"
              aria-describedby="username-hint"
              maxLength="50"
              pattern={User.guestUsernameRegex}
              value={username}
              onChange={updateUsername}
              autoComplete="off"
              disabled={submitting}
              required
              autoFocus
            />
            <ul id="username-hint" className="form-hint marked-list">
              <li>&lt; 50 word characters (a-z, A-Z, 0-9, _).</li>
              <li>At least 1 character after &quot;guest_&quot;.</li>
            </ul>
          </li>
          <li>
            <button ref={submitButton} type="submit" disabled={submitting}>
              {submitting ? "Waiting..." : "Login"}
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

export default GuestLoginForm;

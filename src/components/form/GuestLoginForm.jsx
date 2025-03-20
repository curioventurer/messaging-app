import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import useMsgQuery from "../../hooks/useMsgQuery.jsx";
import Form from "./Form.jsx";
import { FormDetail, User } from "../../../js/chat-data.js";

function GuestLoginForm() {
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState(User.GUEST_LABEL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameInput = useRef(null);
  const submitButton = useRef(null);

  const redirectPath = searchParams.get("rdr");
  const redirectQuery = redirectPath
    ? "?rdr=" + encodeURIComponent(redirectPath)
    : "";

  const navigate = useNavigate();

  useEffect(() => {
    generateUsername();
  }, []);

  function updateIsSubmitting(bool) {
    setIsSubmitting(bool);
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

      navigate(searchParams.get("rdr") ?? "/home", {
        replace: true,
      });
    } else updateOutput(parseOutput(err, info));
  }

  const message = useMsgQuery();
  const outputInitial = message
    ? "Result: " + message
    : "Tip: generate or enter username";

  const formDetail = new FormDetail({
    path: "/api/guest-login",
    data: { username },
    outputInitial,
    outputName: "guest login result",
    outputFor: "username",
    isSubmitting,
    submitButton,
    handleSubmitRes,
    updateIsSubmitting,
  });

  return (
    <div className="form-page auth-page">
      <h1>Guest Login</h1>
      <Form formDetail={formDetail}>
        <ul>
          <li>
            <label htmlFor="username">Username</label>
            <button
              type="button"
              className="clear-background"
              onClick={generateUsername}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              required
              autoFocus
            />
            <ul id="username-hint" className="form-hint marked-list">
              <li>&lt; 50 word characters (a-z, A-Z, 0-9, _).</li>
              <li>At least 1 character after &quot;guest_&quot;.</li>
            </ul>
          </li>
          <li>
            <button ref={submitButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Waiting..." : "Login"}
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

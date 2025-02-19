import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function LoginForm() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState(
    searchParams.has("msg")
      ? "Result: " + searchParams.get("msg")
      : "Tip: enter username and password to login",
  );
  const [passwordIsShown, setPasswordIsShown] = useState(false);
  const [isBlink, setIsBlink] = useState(false);

  const outputRef = useRef(null);

  const navigate = useNavigate();

  const redirectPath = searchParams.get("rdr");
  let authRedirectPath = "/home";
  let otherPath = "/register";

  if (redirectPath) {
    authRedirectPath = redirectPath;
    otherPath = otherPath += "?rdr=" + encodeURIComponent(redirectPath);
  }

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const current = new URLSearchParams(prev);
        current.delete("msg");
        return current;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  function updateUsername(event) {
    setUsername(event.target.value);
  }

  function updatePassword(event) {
    setPassword(event.target.value);
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

  function login(event) {
    event.preventDefault();

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const request = new Request("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers,
    });

    fetch(request)
      .then((res) => res.json())
      .then(({ err, user, info }) => {
        if (user) navigate(authRedirectPath);
        else if (err) updateOutput(err);
        else updateOutput(null, info);
      })
      .catch(() => {});
  }

  return (
    <div className="auth-page">
      <h1>Login</h1>
      <form onSubmit={login}>
        <ul>
          <li>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              maxLength="50"
              pattern="\w+"
              value={username}
              onChange={updateUsername}
              autoComplete="username"
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
              type={passwordIsShown ? "text" : "password"}
              name="password"
              id="current-password"
              minLength="6"
              maxLength="30"
              value={password}
              onChange={updatePassword}
              autoComplete="current-password"
              required
            />
          </li>
          <li>
            <button type="submit" autoFocus>
              Login
            </button>
          </li>
        </ul>
        <output
          name="login result"
          htmlFor="username current-password"
          ref={outputRef}
          className={isBlink ? "blink" : ""}
        >
          {output}
        </output>
      </form>
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

import { useContext, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch.jsx";
import { AppContext } from "./App.jsx";
import { allLinks } from "../../controllers/constant.js";

function Logout() {
  const { logout } = useContext(AppContext);

  const navigate = useNavigate();

  const logoutCB = useCallback(
    (success) => {
      if (success) {
        logout();
        navigate(allLinks.login.href + "?msg=successful+logout", {
          replace: true,
        });
      } else {
        navigate("/error?err=logout", { replace: true });
      }
    },
    [logout, navigate],
  );

  const expired = useFetch({
    path: "/api/logout",
    callback: logoutCB,
  });

  return (
    <>
      <h1>Logout</h1>
      {!expired ? (
        <p className="loading-text loading-ellipsis">
          You are being logged out
        </p>
      ) : (
        <p>
          Logout timed out. Return to <a href="/">index</a> and try again.
        </p>
      )}
    </>
  );
}

export default memo(Logout);

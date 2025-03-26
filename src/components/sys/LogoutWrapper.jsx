import { useContext, memo } from "react";
import { Outlet } from "react-router-dom";
import useRedirect from "../../hooks/useRedirect.jsx";
import { AppContext } from "./App.jsx";
import { allLinks } from "../../controllers/constant.js";

//Redirect when logged out.
function LogoutWrapper() {
  const { client } = useContext(AppContext);

  //Redirect when logged out.
  const currentPath = location.pathname + location.search + location.hash;
  const redirectPath =
    allLinks.login.href + "?rdr=" + encodeURIComponent(currentPath);
  useRedirect({
    enabled: !client,
    path: redirectPath,
    replace: true,
  });

  if (!client) return "redirecting...";

  return <Outlet />;
}

export default memo(LogoutWrapper);

import { useContext, memo } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import useRedirect from "../../hooks/useRedirect.jsx";
import { AppContext } from "./App.jsx";
import { allLinks } from "../../controllers/constant.js";

//Redirect when logged in.
function LoginWrapper() {
  const { client } = useContext(AppContext);
  const [searchParams] = useSearchParams();

  useRedirect({
    enabled: Boolean(client),
    path: searchParams.get("rdr") ?? allLinks.home.href,
    replace: true,
  });

  if (client) return "redirecting...";

  return <Outlet />;
}

export default memo(LoginWrapper);

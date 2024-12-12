import { Outlet } from "react-router-dom";
import Nav from "./Nav";

function Layout() {
  return (
    <div className="layout">
      <Nav />
      <Outlet />
    </div>
  );
}

export default Layout;

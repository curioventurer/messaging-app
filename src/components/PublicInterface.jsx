import { Outlet } from "react-router-dom";
import Nav from "./Nav";

function PublicInterface() {
  return (
    <div className="interface">
      <Nav isPublic />
      <div className="outlet">
        <Outlet />
      </div>
    </div>
  );
}

export default PublicInterface;

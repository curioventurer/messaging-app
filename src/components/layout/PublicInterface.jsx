import { useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import Nav from "./Nav.jsx";
import { AppContext } from "../sys/App.jsx";
import { InterfaceContext } from "./PrivateInterface.jsx";

function PublicInterface() {
  const { client } = useContext(AppContext);

  return (
    <div className="interface">
      <InterfaceContext.Provider
        value={useMemo(
          () => ({
            client,
          }),
          [client],
        )}
      >
        <Nav isPublic />
        <div className="outlet">
          <Outlet />
        </div>
      </InterfaceContext.Provider>
    </div>
  );
}

export default PublicInterface;

import { useMemo } from "react";
import { Outlet, useLoaderData } from "react-router-dom";
import Nav from "./Nav.jsx";
import { InterfaceContext } from "./PrivateInterface.jsx";

function PublicInterface() {
  const client = useLoaderData();

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

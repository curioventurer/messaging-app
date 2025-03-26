import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  createContext,
  memo,
} from "react";
import PropTypes from "prop-types";
import { socket } from "../../controllers/socket.js";
import { getUser } from "../../controllers/router.js";

const APP_CONTEXT_DEFAULT = {
  client: false,
  updateAppStatus: () => {},
  login: () => {},
  logout: () => {},
};

export const AppContext = createContext(APP_CONTEXT_DEFAULT);

function App({ children }) {
  const [client, setClient] = useState(getUser());

  const updateAppStatus = useCallback(function () {
    const user = getUser();
    setClient(user);
  }, []);

  const login = useCallback(function (user) {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("session-date", JSON.stringify(Date.now()));
    setClient(user);
  }, []);

  const logout = useCallback(function () {
    localStorage.removeItem("user");
    localStorage.removeItem("session-date");
    setClient(false);
  }, []);

  useEffect(() => {
    updateAppStatus();
    const interval = setInterval(updateAppStatus, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [updateAppStatus]);

  useEffect(() => {
    if (client) {
      socket.connect();
    } else {
      socket.disconnect();
    }
  }, [client]);

  return (
    <AppContext.Provider
      value={useMemo(
        () => ({
          client,
          updateAppStatus,
          login,
          logout,
        }),
        [client, updateAppStatus, login, logout],
      )}
    >
      {children}
    </AppContext.Provider>
  );
}

App.propTypes = {
  children: PropTypes.element.isRequired,
};

export default memo(App);

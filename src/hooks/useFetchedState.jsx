import { useState, useEffect, useMemo } from "react";
import useFetch from "./useFetch.jsx";

/*Extends react's "useState()", with added management for data fetch.
  Returns a state whose values changes on completion of data fetch.

  Initializes state with undefined to indicate data not yet fetched.
  State is set to null if fetch timeout happens.
  On successful fetch, state is set with callback argument.

  Only supports 1 state for fetched data.
  If multiple state is required for fetched data, define your own state.
    Set them with callback(), provide clearState() to clear them on fetch failure.

  callback: function(data, setState) to parse received data and store in state.
  path: url to fetch data.
  options: passed to useFetch as options for fetch.
  timeoutDuration: timeout for fetch.
  clearState: function(value) to clear multiple states by setting to value, when using multiple states.

  Returns: [state, setState]
*/
function useFetchedState({
  callback = null,
  path = "/api/test",
  options = null,
  timeoutDuration = 5000,
  clearState = null,
}) {
  const [state, setState] = useState(undefined);

  //Pass setState to callback to store fetched data.
  const modified_cb = useMemo(
    function () {
      if (callback) return (data) => callback(data, setState);
      else return null;
    },
    [callback],
  );

  const isExpired = useFetch({
    callback: modified_cb,
    path,
    options,
    timeoutDuration,
  });

  /*If fetch timeouts(expires), set state to null to indicate fetch failure.
    Else, initialize state to undefined to indicate fetch in progress.
  */
  useEffect(() => {
    if (isExpired) {
      setState(null);
      if (clearState) clearState(null);
    } else {
      setState(undefined);
      if (clearState) clearState(undefined);
    }
  }, [isExpired, clearState]);

  //On changes to fetch parameters, clear state to avoid showing previous values, also used to specify the display of loading text.
  useEffect(() => {
    setState(undefined);
    if (clearState) clearState(undefined);
  }, [callback, path, options, clearState]);

  return useMemo(() => [state, setState], [state, setState]);
}

export default useFetchedState;

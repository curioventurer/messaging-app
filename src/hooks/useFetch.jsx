import { useState, useEffect } from "react";

const FETCH_ABORT = "FetchAbort";

function useFetch({
  callback = null,
  path = "/api/test",
  options = null,
  timeoutDuration = 5000,
  disable = false,
}) {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (disable) return;

    setIsExpired(false);
    function expire() {
      setIsExpired(true);
    }
    const timeout = setTimeout(expire, timeoutDuration);

    const controller = new AbortController();
    const request = new Request(path, {
      signal: controller.signal,
      ...options,
    });

    fetch(request)
      .then((res) => {
        clearTimeout(timeout);
        return res.json();
      })
      .then(callback)
      .catch((err) => {
        clearTimeout(timeout);
        if (err.message !== FETCH_ABORT) expire();
      });

    return () => {
      controller.abort(new Error(FETCH_ABORT));
    };
  }, [callback, path, options, timeoutDuration, disable]);

  return isExpired;
}

export default useFetch;

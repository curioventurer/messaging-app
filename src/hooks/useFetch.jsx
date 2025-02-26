import { useState, useEffect } from "react";

const FETCH_ABORT = "FetchAbort";

function useFetch(
  callback = function () {},
  path = "/api/test",
  timeoutDuration = 5000,
) {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setIsExpired(false);
    function expire() {
      setIsExpired(true);
    }
    const timeout = setTimeout(expire, timeoutDuration);

    const controller = new AbortController();
    const request = new Request(path, { signal: controller.signal });

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
  }, [path, callback, timeoutDuration]);

  return isExpired;
}

export default useFetch;

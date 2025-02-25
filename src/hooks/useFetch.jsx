import { useState, useEffect } from "react";

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
      .catch(() => {
        clearTimeout(timeout);
        expire();
      });

    return () => {
      clearTimeout(timeout);

      controller.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, [path, callback, timeoutDuration]);

  return isExpired;
}

export default useFetch;

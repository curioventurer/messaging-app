import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/*When enabled, redirect after some delay.
  Redirect is canceled if disabled before delay.
*/
function useRedirect({
  enabled = false,
  replace = false,
  path = "/",
  delay = 100,
}) {
  const timeoutRef = useRef(null);
  const deadlineRef = useRef(null);

  const navigate = useNavigate();

  const startRedirect = useCallback(
    function () {
      timeoutRef.current = setTimeout(() => {
        navigate(path, { replace });
      }, delay);

      deadlineRef.current = Date.now() + delay;
    },
    [path, delay, replace, navigate],
  );

  function stopRedirect() {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    deadlineRef.current = null;
  }

  useEffect(() => {
    if (enabled) {
      startRedirect();
      return stopRedirect;
    }
  }, [enabled, startRedirect]);

  return deadlineRef.current;
}

export default useRedirect;

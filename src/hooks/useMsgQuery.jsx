import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/*Msg search query is used to provide message to page loaded with the url containing the query.
  It is only meant to be used once on load, and not shown on reload.
  It is also not meant to be shown on the url.
  Thus, it is cleared from the url after returning message.

  Used to show message from the page it is redirected from.
  Or to store a 1 time message in a created url.
*/
function useMsgQuery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const message = searchParams.get("msg");

  //Clear from url
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const current = new URLSearchParams(prev);
        current.delete("msg");
        return current;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  return message;
}

export default useMsgQuery;

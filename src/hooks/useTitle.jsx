import { useEffect } from "react";

function useTitle(title = "default", disable = false) {
  useEffect(() => {
    if (!disable) document.title = title;
  }, [title, disable]);
}

export default useTitle;

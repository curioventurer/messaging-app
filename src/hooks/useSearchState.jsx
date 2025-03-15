import { useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { searchType } from "../controllers/constant.js";

function useSearchState({
  param = "",
  type = searchType.STRING,
  initialState,
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  //Used by setState to access updated setSearchParams values while remaining constant.
  const ref_setSearch = useRef(setSearchParams);
  ref_setSearch.current = setSearchParams;

  const state = useMemo(() => {
    if (type === searchType.STRING)
      return searchParams.get(param) ?? initialState ?? "";
    else if (type === searchType.BOOL) return searchParams.has(param);
    else if (type === searchType.ARRAY)
      //usememo
      return searchParams.getAll(param);
  }, [searchParams, initialState, param, type]);

  //updates potentially triggering unnecessary updates?
  const setState = useCallback(
    function (parameter) {
      ref_setSearch.current(
        (prev) => {
          const current = new URLSearchParams(prev);

          if (type === searchType.STRING) {
            let string = "";
            if (parameter instanceof Function)
              string = parameter(current.get(param) ?? "");
            else string = parameter;

            current.set(param, string);
          } else if (type === searchType.BOOL) {
            let bool = false;
            if (parameter instanceof Function)
              bool = parameter(current.has(param));
            else bool = parameter;

            if (bool) current.set(param, "");
            else current.delete(param);
          } else if (type === searchType.ARRAY) {
            let array = [];
            if (parameter instanceof Function)
              array = parameter(current.getAll(param));
            else array = parameter;

            current.delete(param);
            array.forEach((value) => current.append(param, value));
          }

          return current;
        },
        { replace: true },
      );
    },
    [param, type],
  );

  //Initialize param if it is null for string type.
  useEffect(() => {
    if (type === searchType.STRING) {
      ref_setSearch.current(
        (prev) => {
          if (prev.get(param) === null) {
            const current = new URLSearchParams(prev);
            current.set(param, initialState ?? "");

            return current;
          } else return prev;
        },
        { replace: true },
      );
    }
  }, [initialState, param, type]);

  return useMemo(() => [state, setState], [state, setState]);
}

export default useSearchState;

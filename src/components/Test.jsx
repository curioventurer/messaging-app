//test code - react component used for testing

import { useState, useCallback, memo } from "react";
import useFetchedState from "../hooks/useFetchedState";
import Loading from "./sys/Loading";
import LoadFail from "./sys/LoadFail";

function Test() {
  const [i, setI] = useState(0);
  const [t, setT] = useState(false);
  console.log("test", i, t);

  const parseData = useCallback(function (data, setState) {
    console.log("parse", data);
    setState(100);
  }, []);

  const [data, setData] = useFetchedState({
    path: "/api/delay/500",
    callback: parseData,
    timeoutDuration: 1000,
  });
  console.log("data", data);

  return (
    <>
      <h1>Test</h1>
      <output style={{ display: "block", margin: "20px" }}>i: {i}</output>
      <button
        onClick={function () {
          setI((prev) => prev + 1);
          setData((prev) => prev + 1);
        }}
      >
        click
      </button>
      <button onClick={() => setT(false)}>False</button>
      <button onClick={() => setT(true)}>True</button>
      <Loading />
      <LoadFail />
    </>
  );
}

export default memo(Test);

//test code - react component used for testing

import { useState, memo } from "react";
import useFetch from "../hooks/useFetch";
import Loading from "./sys/Loading";
import LoadFail from "./sys/LoadFail";

function Test() {
  const [i, setI] = useState(0);
  const [t, setT] = useState(false);
  console.log(i, t);

  useFetch({});

  return (
    <>
      <h1>Test</h1>
      <output style={{ display: "block", margin: "20px" }}>i: {i}</output>
      <button
        onClick={function () {
          setI((prev) => prev + 1);
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
